import { ethers } from "ethers";

/**
 * Script to encode constructor arguments for contract verification
 */

console.log("🔧 Encoding Constructor Arguments for Contract Verification\n");

// Contract addresses from deployment
const USDC_ADDRESS = "0x6ffa623d295969e1cc9fef0f3938d3d5cff4e384";
const VAULT_ADDRESS = "0x63b4889ddf3e7889f39dae1cbd467d824b340cea";

console.log("📋 Deployment Addresses:");
console.log("   USDC:  ", USDC_ADDRESS);
console.log("   Vault: ", VAULT_ADDRESS);
console.log("");

// ============================================================
// 1. MantleYieldVault Constructor Arguments
// ============================================================
console.log("1️⃣ MantleYieldVault Constructor Arguments:");
console.log("   Parameters:");
console.log("   - _asset:  ", USDC_ADDRESS);
console.log("   - _name:   ", "MantleYield USDC");
console.log("   - _symbol: ", "myUSDC");
console.log("");

const vaultAbi = [
    "constructor(address _asset, string memory _name, string memory _symbol)"
];
const vaultIface = new ethers.Interface(vaultAbi);
const vaultArgs = vaultIface.encodeDeploy([
    USDC_ADDRESS,
    "MantleYield USDC",
    "myUSDC"
]);

// Remove the '0x' prefix for Mantle Explorer
const vaultArgsHex = vaultArgs.slice(2);

console.log("   Encoded (with 0x):");
console.log("   " + vaultArgs);
console.log("");
console.log("   Encoded (without 0x - for Mantle Explorer):");
console.log("   " + vaultArgsHex);
console.log("");

// ============================================================
// 2. IdleStrategy Constructor Arguments
// ============================================================
console.log("2️⃣ IdleStrategy Constructor Arguments:");
console.log("   Parameters:");
console.log("   - _asset: ", USDC_ADDRESS);
console.log("   - _vault: ", VAULT_ADDRESS);
console.log("");

const strategyAbi = [
    "constructor(address _asset, address _vault)"
];
const strategyIface = new ethers.Interface(strategyAbi);
const strategyArgs = strategyIface.encodeDeploy([
    USDC_ADDRESS,
    VAULT_ADDRESS
]);

// Remove the '0x' prefix for Mantle Explorer
const strategyArgsHex = strategyArgs.slice(2);

console.log("   Encoded (with 0x):");
console.log("   " + strategyArgs);
console.log("");
console.log("   Encoded (without 0x - for Mantle Explorer):");
console.log("   " + strategyArgsHex);
console.log("");

// ============================================================
// Summary
// ============================================================
console.log("=".repeat(60));
console.log("📝 Summary - Copy These for Verification");
console.log("=".repeat(60));
console.log("");

console.log("MockUSDC (0x6ffa623d295969e1cc9fef0f3938d3d5cff4e384):");
console.log("0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000094d6f636b205553444300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004555344430000000000000000000000000000000000000000000000000000000");
console.log("");

console.log("MantleYieldVault (0x63b4889ddf3e7889f39dae1cbd467d824b340cea):");
console.log(vaultArgsHex);
console.log("");

console.log("IdleStrategy (0xfb37ec4fa465e46bb824afb405449597758bbeed):");
console.log(strategyArgsHex);
console.log("");

console.log("=".repeat(60));
console.log("✅ All constructor arguments encoded successfully!");
console.log("=".repeat(60));
