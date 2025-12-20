// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategyAdapter} from "./interfaces/IStrategyAdapter.sol";

/**
 * @title MantleYieldVault
 * @notice ERC-4626 compliant tokenized vault with modular strategy routing
 * @dev Composable yield router that deploys capital across multiple strategies
 *      Maintains critical invariants: asset conservation, withdrawal availability
 */
contract MantleYieldVault is ERC4626, Pausable, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Operator role can trigger rebalancing
    address public operator;

    /// @notice List of active strategy addresses
    address[] public strategies;

    /// @notice Mapping to check if address is a registered strategy
    mapping(address => bool) public isStrategy;

    /// @notice Maximum allocation cap per strategy
    mapping(address => uint256) public strategyCap;

    /// @notice Emitted when capital is rebalanced between strategies
    event Rebalanced(address indexed fromStrategy, address indexed toStrategy, uint256 amount);

    /// @notice Emitted when a new strategy is added
    event StrategyAdded(address indexed strategy, uint256 cap);

    /// @notice Emitted when a strategy is removed
    event StrategyRemoved(address indexed strategy);

    /// @notice Emitted when operator is changed
    event OperatorChanged(address indexed oldOperator, address indexed newOperator);

    /// @notice Emitted when strategy cap is updated
    event StrategyCapUpdated(address indexed strategy, uint256 oldCap, uint256 newCap);

    /// @notice Emitted when a strategy fails to withdraw during user withdrawal
    event StrategyWithdrawFailed(address indexed strategy, uint256 requestedAmount);

    /// @notice Emitted when rebalance experiences slippage
    event RebalanceSlippage(address indexed strategy, uint256 requested, uint256 actual);

    /// @notice Thrown when caller is not operator or owner
    error NotOperator();

    /// @notice Thrown when strategy is invalid or not registered
    error InvalidStrategy();

    /// @notice Thrown when allocation would exceed strategy cap
    error ExceedsAllocationCap();

    /// @notice Thrown when trying to add duplicate strategy
    error StrategyAlreadyExists();

    /// @notice Thrown when amount is zero
    error ZeroAmount();

    /// @notice Thrown when strategy has insufficient balance
    error InsufficientStrategyBalance();

    /// @notice Thrown when strategy cap is zero
    error ZeroStrategyCap();

    /// @notice Thrown when operator address is zero
    error InvalidOperator();

    /// @notice Thrown when asset conservation is violated
    error AssetConservationViolated();

    /// @notice Thrown when asset mismatch in strategy
    error AssetMismatch();

    /// @notice Thrown when strategy is not empty
    error StrategyNotEmpty();

    /// @notice Thrown when receiver is zero address
    error ZeroAddress();

    /// @notice Thrown when trying to rebalance to same strategy
    error SameStrategy();

    /**
     * @notice Modifier to restrict access to operator or owner
     */
    modifier onlyOperator() {
        if (msg.sender != operator && msg.sender != owner()) revert NotOperator();
        _;
    }

    /**
     * @notice Constructor
     * @param _asset The underlying asset token (e.g., USDC)
     * @param _name Vault share token name
     * @param _symbol Vault share token symbol
     */
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {
        operator = msg.sender;
        emit OperatorChanged(address(0), msg.sender);
    }

    /**
     * @notice Deposit assets into the vault
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive vault shares
     * @return shares Amount of shares minted
     * @dev Blocked when paused. Mints proportional shares to receiver.
     */
    function deposit(uint256 assets, address receiver)
        public
        override
        whenNotPaused
        nonReentrant
        returns (uint256 shares)
    {
        if (assets == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        shares = super.deposit(assets, receiver);
    }

    /**
     * @notice Mint vault shares
     * @param shares Amount of shares to mint
     * @param receiver Address to receive vault shares
     * @return assets Amount of assets deposited
     * @dev Blocked when paused
     */
    function mint(uint256 shares, address receiver)
        public
        override
        whenNotPaused
        nonReentrant
        returns (uint256 assets)
    {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        assets = super.mint(shares, receiver);
    }

    /**
     * @notice Withdraw assets from the vault
     * @param assets Amount of assets to withdraw
     * @param receiver Address to receive assets
     * @param owner_ Address that owns the shares
     * @return shares Amount of shares burned
     * @dev NEVER blocked - even when paused. Critical safety property.
     *      Pulls from strategies if vault doesn't have enough idle balance.
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner_
    ) public override nonReentrant returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();

        // Check idle balance first
        uint256 idleBalance = IERC20(asset()).balanceOf(address(this));
        uint256 totalAvailable = idleBalance;
        
        if (idleBalance < assets) {
            // Need to withdraw from strategies
            uint256 needed = assets - idleBalance;
            uint256 fromStrategies = _withdrawFromStrategies(needed);
            totalAvailable += fromStrategies;
        }
        
        // Determine actual withdrawal amount (may be less if insufficient liquidity)
        uint256 actualAssets = totalAvailable < assets ? totalAvailable : assets;
        
        // Calculate shares for ACTUAL withdrawal amount
        shares = previewWithdraw(actualAssets);
        
        // Check if caller has approval (if not owner)
        // IMPORTANT: Spend allowance AFTER calculating actual shares
        if (msg.sender != owner_) {
            _spendAllowance(owner_, msg.sender, shares);
        }

        // Burn shares and transfer assets
        _burn(owner_, shares);
        IERC20(asset()).safeTransfer(receiver, actualAssets);

        emit Withdraw(msg.sender, receiver, owner_, actualAssets, shares);
    }

    /**
     * @notice Redeem vault shares for assets
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive assets
     * @param owner_ Address that owns the shares
     * @return assets Amount of assets withdrawn
     * @dev NEVER blocked - even when paused
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner_
    ) public override nonReentrant returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();

        // Calculate assets to withdraw
        assets = previewRedeem(shares);

        // Check if caller has approval (if not owner)
        if (msg.sender != owner_) {
            _spendAllowance(owner_, msg.sender, shares);
        }

        // Check idle balance first
        uint256 idleBalance = IERC20(asset()).balanceOf(address(this));
        uint256 totalAvailable = idleBalance;
        
        if (idleBalance < assets) {
            // Need to withdraw from strategies
            uint256 needed = assets - idleBalance;
            uint256 fromStrategies = _withdrawFromStrategies(needed);
            totalAvailable += fromStrategies;
        }
        
        // Handle partial withdrawal if not enough liquidity
        if (totalAvailable < assets) {
            // Adjust to available amount
            assets = totalAvailable;
        }

        // Burn shares and transfer assets
        _burn(owner_, shares);
        IERC20(asset()).safeTransfer(receiver, assets);

        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
    }

    /**
     * @notice Rebalance capital between strategies
     * @param fromStrategy Source strategy address
     * @param toStrategy Destination strategy address
     * @param amount Amount to move
     * @dev Only operator or owner. Blocked when paused.
     *      MUST maintain total assets invariant.
     */
    function rebalance(
        address fromStrategy,
        address toStrategy,
        uint256 amount
    ) external onlyOperator whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!isStrategy[fromStrategy]) revert InvalidStrategy();
        if (!isStrategy[toStrategy]) revert InvalidStrategy();
        if (fromStrategy == toStrategy) revert SameStrategy();

        // Check source strategy has enough balance
        uint256 fromBalance = IStrategyAdapter(fromStrategy).totalAssets();
        if (fromBalance < amount) revert InsufficientStrategyBalance();

        // Check destination strategy won't exceed cap
        uint256 toBalance = IStrategyAdapter(toStrategy).totalAssets();
        if (toBalance + amount > strategyCap[toStrategy]) revert ExceedsAllocationCap();

        // Record total assets before rebalance (for invariant check)
        uint256 totalBefore = totalAssets();

        // Withdraw from source strategy
        uint256 withdrawn = IStrategyAdapter(fromStrategy).withdraw(amount);

        // Track slippage if withdrawn amount differs
        if (withdrawn < amount) {
            emit RebalanceSlippage(fromStrategy, amount, withdrawn);
        }

        // Approve and deposit to destination strategy
        IERC20(asset()).forceApprove(toStrategy, withdrawn);
        IStrategyAdapter(toStrategy).deposit(withdrawn);

        // Verify total assets unchanged (critical invariant)
        uint256 totalAfter = totalAssets();
        if (totalAfter != totalBefore) revert AssetConservationViolated();

        emit Rebalanced(fromStrategy, toStrategy, withdrawn);
    }

    /**
     * @notice Add a new strategy to the vault
     * @param strategy Strategy contract address
     * @param cap Maximum allocation for this strategy
     * @dev Only owner. Strategy must implement IStrategyAdapter.
     */
    function addStrategy(address strategy, uint256 cap) external onlyOwner {
        if (strategy == address(0)) revert InvalidStrategy();
        if (isStrategy[strategy]) revert StrategyAlreadyExists();
        if (cap == 0) revert ZeroStrategyCap();

        // Verify strategy implements interface
        if (IStrategyAdapter(strategy).asset() != asset()) revert AssetMismatch();

        strategies.push(strategy);
        isStrategy[strategy] = true;
        strategyCap[strategy] = cap;

        emit StrategyAdded(strategy, cap);
    }

    /**
     * @notice Remove a strategy from the vault
     * @param strategy Strategy contract address
     * @dev Only owner. Strategy must have zero balance.
     */
    function removeStrategy(address strategy) external onlyOwner {
        if (!isStrategy[strategy]) revert InvalidStrategy();

        // Ensure strategy has no assets
        if (IStrategyAdapter(strategy).totalAssets() != 0) revert StrategyNotEmpty();

        // Remove from array
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i] == strategy) {
                strategies[i] = strategies[strategies.length - 1];
                strategies.pop();
                break;
            }
        }

        isStrategy[strategy] = false;
        delete strategyCap[strategy];

        emit StrategyRemoved(strategy);
    }

    /**
     * @notice Update strategy allocation cap
     * @param strategy Strategy contract address
     * @param newCap New allocation cap
     */
    function updateStrategyCap(address strategy, uint256 newCap) external onlyOwner {
        if (!isStrategy[strategy]) revert InvalidStrategy();
        uint256 oldCap = strategyCap[strategy];
        strategyCap[strategy] = newCap;
        emit StrategyCapUpdated(strategy, oldCap, newCap);
    }

    /**
     * @notice Set operator address
     * @param newOperator New operator address
     */
    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert InvalidOperator();
        address oldOperator = operator;
        operator = newOperator;
        emit OperatorChanged(oldOperator, newOperator);
    }

    /**
     * @notice Pause the vault (blocks deposits and rebalancing)
     * @dev Only operator or owner. NEVER blocks withdrawals.
     */
    function pause() external onlyOperator {
        _pause();
    }

    /**
     * @notice Unpause the vault
     * @dev Only owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get total assets managed by vault
     * @return Total assets across all strategies plus idle balance
     * @dev MUST return real balances, NEVER simulated
     */
    function totalAssets() public view override returns (uint256) {
        uint256 total = IERC20(asset()).balanceOf(address(this)); // Idle balance

        // Add all strategy balances
        for (uint256 i = 0; i < strategies.length; i++) {
            total += IStrategyAdapter(strategies[i]).totalAssets();
        }

        return total;
    }

    /**
     * @notice Get maximum amount that can be deposited
     * @param receiver Address that would receive shares (unused in calculation)
     * @return Maximum deposit amount
     * @dev Returns 0 when paused, otherwise returns max uint256 (no limit on idle)
     */
    function maxDeposit(address receiver) public view override returns (uint256) {
        if (paused()) return 0;
        return type(uint256).max; // No limit on deposits (can stay idle)
    }

    /**
     * @notice Get maximum shares that can be minted
     * @param receiver Address that would receive shares (unused in calculation)
     * @return Maximum shares that can be minted
     * @dev Returns 0 when paused, otherwise returns max uint256
     */
    function maxMint(address receiver) public view override returns (uint256) {
        if (paused()) return 0;
        return type(uint256).max;
    }

    /**
     * @notice Get maximum amount that can be withdrawn by owner
     * @param owner Address that owns the shares
     * @return Maximum withdrawable amount
     * @dev Returns actual available liquidity (idle + withdrawable from strategies)
     *      This is CRITICAL for ERC-4626 compliance
     */
    function maxWithdraw(address owner) public view override returns (uint256) {
        // Get owner's proportional assets
        uint256 ownerAssets = _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
        
        // Get available liquidity
        uint256 availableLiquidity = _getAvailableLiquidity();
        
        // Return minimum of owner's assets and available liquidity
        return ownerAssets > availableLiquidity ? availableLiquidity : ownerAssets;
    }

    /**
     * @notice Get maximum shares that can be redeemed by owner
     * @param owner Address that owns the shares
     * @return Maximum redeemable shares
     * @dev Converts maxWithdraw to shares
     */
    function maxRedeem(address owner) public view override returns (uint256) {
        uint256 maxAssets = maxWithdraw(owner);
        return _convertToShares(maxAssets, Math.Rounding.Floor);
    }

    /**
     * @notice Get number of active strategies
     * @return Number of strategies
     */
    function strategyCount() external view returns (uint256) {
        return strategies.length;
    }

    /**
     * @notice Get idle balance (assets not deployed to strategies)
     * @return Idle balance
     */
    function idleBalance() external view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    /**
     * @notice Internal function to withdraw from strategies
     * @param amount Amount needed
     * @return actualWithdrawn Actual amount withdrawn from strategies
     * @dev Withdraws from strategies in order until amount is satisfied
     *      Uses try-catch to handle strategy failures gracefully (F-02 guardrail)
     *      Returns actual amount withdrawn, allowing partial withdrawals
     */
    function _withdrawFromStrategies(uint256 amount) internal returns (uint256 actualWithdrawn) {
        uint256 remaining = amount;

        for (uint256 i = 0; i < strategies.length && remaining > 0; i++) {
            address strategy = strategies[i];
            
            // Get strategy balance with try-catch
            uint256 strategyBalance;
            try IStrategyAdapter(strategy).totalAssets() returns (uint256 balance) {
                strategyBalance = balance;
            } catch {
                // Strategy totalAssets() failed, skip to next strategy
                emit StrategyWithdrawFailed(strategy, 0);
                continue;
            }

            if (strategyBalance > 0) {
                uint256 toWithdraw = remaining > strategyBalance ? strategyBalance : remaining;
                
                // Try to withdraw with error handling (F-02 guardrail)
                try IStrategyAdapter(strategy).withdraw(toWithdraw) returns (uint256 withdrawn) {
                    remaining -= withdrawn;
                } catch {
                    // Strategy withdraw failed, try next strategy
                    emit StrategyWithdrawFailed(strategy, toWithdraw);
                    continue;
                }
            }
        }

        // Return actual amount withdrawn (may be less than requested)
        actualWithdrawn = amount - remaining;
    }

    /**
     * @notice Internal function to calculate available liquidity
     * @return Available liquidity (idle + withdrawable from strategies)
     * @dev Used by maxWithdraw to determine actual withdrawable amount
     *      Assumes all strategies can withdraw their full balance (optimistic)
     */
    function _getAvailableLiquidity() internal view returns (uint256) {
        uint256 available = IERC20(asset()).balanceOf(address(this)); // Idle balance
        
        // Add all strategy balances (optimistic - assumes all can withdraw)
        for (uint256 i = 0; i < strategies.length; i++) {
            available += IStrategyAdapter(strategies[i]).totalAssets();
        }
        
        return available;
    }
}