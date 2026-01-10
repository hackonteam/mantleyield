import hre from "hardhat";
import { parseUnits, formatUnits } from "viem";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for MantleYield on Mantle Sepolia
 * 
 * Usage:
 * npx hardhat run scripts/deploy.ts --network mantleSepolia
 */
async function main() {
    console.log("🚀 Deploying MantleYield to Mantle Sepolia...\n");

    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    console.log("📍 Deployer address:", deployer.account.address);
    console.log("🌐 Network:", hre.network.name);
    console.log("⛓️  Chain ID:", await publicClient.getChainId());

    // Get deployer balance
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log("💰 Deployer balance:", formatUnits(balance, 18), "MNT\n");

    // USDC address on Mantle Sepolia
    // TODO: Update with actual Mantle Sepolia USDC address
    // For now, we'll deploy a mock USDC for testing
    const USDC_ADDRESS = process.env.MANTLE_SEPOLIA_USDC_ADDRESS || "";

    let usdcAddress: `0x${string}` = USDC_ADDRESS as `0x${string}`;

    // If no USDC address provided, deploy a mock ERC20 for testing
    if (!usdcAddress) {
        console.log("⚠️  No USDC address provided, deploying MockUSDC for testing...");

        // Deploy MockUSDC (simple ERC20)
        const mockUSDC = await hre.viem.deployContract("MockERC20", [
            "Mock USDC",
            "USDC",
            6n, // 6 decimals like real USDC
        ]);

        usdcAddress = mockUSDC.address;
        console.log("✅ MockUSDC deployed at:", usdcAddress);

        // Mint some tokens to deployer for testing
        console.log("⏳ Minting 1,000,000 USDC to deployer...");
        const mintAmount = parseUnits("1000000", 6); // 1M USDC
        const mintTx = await mockUSDC.write.mint([deployer.account.address, mintAmount]);

        // Wait for transaction with longer timeout for testnet
        console.log("⏳ Waiting for mint transaction confirmation...");
        try {
            await publicClient.waitForTransactionReceipt({
                hash: mintTx,
                timeout: 120_000, // 2 minutes timeout for testnet
                pollingInterval: 2_000, // Check every 2 seconds
            });
            console.log("✅ Minted 1,000,000 USDC to deployer\n");
        } catch (error) {
            console.log("⚠️  Mint transaction may still be pending, continuing deployment...");
            console.log("   You can check transaction status at: https://sepolia.mantlescan.xyz/tx/" + mintTx);
            console.log("");
        }
    } else {
        console.log("📌 Using USDC at:", usdcAddress, "\n");
    }

    // Deploy MantleYieldVault
    console.log("📦 Deploying MantleYieldVault...");
    const vault = await hre.viem.deployContract("MantleYieldVault", [
        usdcAddress,
        "MantleYield USDC",
        "myUSDC",
    ]);
    console.log("✅ MantleYieldVault deployed at:", vault.address);

    // Deploy IdleStrategy
    console.log("\n📦 Deploying IdleStrategy...");
    const idleStrategy = await hre.viem.deployContract("IdleStrategy", [
        usdcAddress,
        vault.address,
    ]);
    console.log("✅ IdleStrategy deployed at:", idleStrategy.address);

    // Add IdleStrategy to vault
    console.log("\n⚙️  Adding IdleStrategy to vault...");
    const strategyCap = parseUnits("1000000", 6); // 1M USDC cap
    const addStrategyTx = await vault.write.addStrategy([idleStrategy.address, strategyCap], {
        account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({
        hash: addStrategyTx,
        timeout: 120_000,
        pollingInterval: 2_000,
    });
    console.log("✅ IdleStrategy added with cap: 1,000,000 USDC");

    // Set operator (same as deployer for now)
    console.log("\n⚙️  Setting operator...");
    const setOperatorTx = await vault.write.setOperator([deployer.account.address], {
        account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({
        hash: setOperatorTx,
        timeout: 120_000,
        pollingInterval: 2_000,
    });
    console.log("✅ Operator set to:", deployer.account.address);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Deployment Complete!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("   USDC:           ", usdcAddress);
    console.log("   Vault:          ", vault.address);
    console.log("   IdleStrategy:   ", idleStrategy.address);
    console.log("\n🔗 Mantle Sepolia Explorer:");
    console.log("   Vault:          ", `https://sepolia.mantlescan.xyz/address/${vault.address}`);
    console.log("   IdleStrategy:   ", `https://sepolia.mantlescan.xyz/address/${idleStrategy.address}`);
    console.log("\n💡 Next Steps:");
    console.log("   1. Verify contracts on Mantle Explorer");
    console.log("   2. Get testnet USDC from faucet (if using real USDC)");
    console.log("   3. Test deposit/withdraw flows");
    console.log("   4. Deploy frontend and connect to contracts");
    console.log("=".repeat(60) + "\n");

    // Save deployment info to file
    const deploymentInfo = {
        network: hre.network.name,
        chainId: Number(await publicClient.getChainId()),
        deployer: deployer.account.address,
        timestamp: new Date().toISOString(),
        contracts: {
            usdc: usdcAddress,
            vault: vault.address,
            idleStrategy: idleStrategy.address,
        },
    };

    const deploymentsDir = path.join(process.cwd(), "deployments");

    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    const filename = `${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentsDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("📄 Deployment info saved to:", `deployments/${filename}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });