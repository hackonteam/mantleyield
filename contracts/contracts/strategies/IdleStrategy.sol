// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";

/**
 * @title IdleStrategy
 * @notice Baseline strategy that holds assets without deploying them (0% yield)
 * @dev This is NOT a mock - it holds real tokens with real balances
 *      Purpose: Proves capital routing mechanism works, provides liquidity buffer
 */
contract IdleStrategy is IStrategyAdapter, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The underlying asset token (e.g., USDC)
    IERC20 public immutable assetToken;

    /// @notice The vault address that owns this strategy
    address public immutable vault;

    /// @notice Emitted when assets are deposited
    event Deposited(uint256 amount);

    /// @notice Emitted when assets are withdrawn
    event Withdrawn(uint256 amount);

    /// @notice Thrown when caller is not the vault
    error OnlyVault();

    /// @notice Thrown when trying to deposit zero amount
    error ZeroAmount();

    /**
     * @notice Modifier to restrict access to vault only
     */
    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    /**
     * @notice Constructor
     * @param _asset The underlying asset token address
     * @param _vault The vault address that will manage this strategy
     */
    constructor(address _asset, address _vault) Ownable(msg.sender) {
        require(_asset != address(0), "Invalid asset");
        require(_vault != address(0), "Invalid vault");
        
        assetToken = IERC20(_asset);
        vault = _vault;
    }

    /**
     * @notice Deposit assets into the strategy
     * @param amount The amount of assets to deposit
     * @dev Simply holds the tokens - generates 0% yield (legitimate baseline)
     */
    function deposit(uint256 amount) external override onlyVault {
        if (amount == 0) revert ZeroAmount();

        // Transfer tokens from vault to this strategy
        assetToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(amount);
    }

    /**
     * @notice Withdraw assets from the strategy
     * @param amount The amount of assets to withdraw
     * @return actualAmount The actual amount withdrawn (same as requested for idle)
     * @dev Returns tokens from idle balance to vault
     */
    function withdraw(uint256 amount) external override onlyVault returns (uint256 actualAmount) {
        if (amount == 0) revert ZeroAmount();

        uint256 balance = assetToken.balanceOf(address(this));
        actualAmount = amount > balance ? balance : amount;

        // Transfer tokens back to vault
        assetToken.safeTransfer(msg.sender, actualAmount);

        emit Withdrawn(actualAmount);
    }

    /**
     * @notice Get total assets managed by this strategy
     * @return Total assets held (REAL balance, not simulated)
     * @dev Returns actual token balance - no yield calculation
     */
    function totalAssets() external view override returns (uint256) {
        return assetToken.balanceOf(address(this));
    }

    /**
     * @notice Get the underlying asset address
     * @return Address of the ERC20 asset token
     */
    function asset() external view override returns (address) {
        return address(assetToken);
    }

    /**
     * @notice Emergency withdraw function (owner only)
     * @dev Allows owner to recover funds in case of emergency
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = assetToken.balanceOf(address(this));
        if (balance > 0) {
            assetToken.safeTransfer(owner(), balance);
        }
    }
}
