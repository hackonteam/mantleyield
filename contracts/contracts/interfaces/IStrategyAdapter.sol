// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStrategyAdapter
 * @notice Standard interface for all yield strategy adapters in MantleYield
 * @dev All strategies must implement this interface to be compatible with the vault
 */
interface IStrategyAdapter {
    /**
     * @notice Deposit assets into the strategy
     * @param amount The amount of assets to deposit
     * @dev Must transfer assets from vault to strategy and deploy to underlying protocol
     */
    function deposit(uint256 amount) external;

    /**
     * @notice Withdraw assets from the strategy
     * @param amount The amount of assets to withdraw
     * @return actualAmount The actual amount withdrawn (may differ due to slippage)
     * @dev Must recall assets from underlying protocol and transfer to vault
     */
    function withdraw(uint256 amount) external returns (uint256 actualAmount);

    /**
     * @notice Get total assets managed by this strategy
     * @return Total assets in the strategy (must be real balance, not simulated)
     * @dev MUST return actual balance from protocol, NEVER mock or simulate
     */
    function totalAssets() external view returns (uint256);

    /**
     * @notice Get the underlying asset address
     * @return Address of the ERC20 asset token
     */
    function asset() external view returns (address);
}