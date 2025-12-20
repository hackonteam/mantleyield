import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for MantleYield contracts
 * Deploys: IdleStrategy, MantleYieldVault
 * Network: Mantle Sepolia Testnet
 */
const MantleYieldModule = buildModule("MantleYieldModule", (m) => {
    // Mantle Sepolia USDC address (testnet)
    // TODO: Replace with actual Mantle Sepolia USDC address
    const usdcAddress = m.getParameter("usdcAddress", "0x0000000000000000000000000000000000000000");

    // Vault parameters
    const vaultName = m.getParameter("vaultName", "MantleYield USDC");
    const vaultSymbol = m.getParameter("vaultSymbol", "myUSDC");

    // Deploy MantleYieldVault
    const vault = m.contract("MantleYieldVault", [usdcAddress, vaultName, vaultSymbol]);

    // Deploy IdleStrategy
    const idleStrategy = m.contract("IdleStrategy", [usdcAddress, vault]);

    // Strategy allocation cap (e.g., 1,000,000 USDC = 1,000,000 * 10^6)
    const strategyCap = m.getParameter("strategyCap", 1000000000000n); // 1M USDC

    // Add IdleStrategy to vault
    m.call(vault, "addStrategy", [idleStrategy, strategyCap]);

    return { vault, idleStrategy };
});

export default MantleYieldModule;
