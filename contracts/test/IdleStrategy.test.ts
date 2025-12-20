import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";

describe("IdleStrategy", function () {
    // Fixture to deploy contracts
    async function deployIdleStrategyFixture() {
        const [owner, vault, user1, attacker] = await hre.viem.getWalletClients();

        // Deploy MockERC20 (USDC with 6 decimals)
        const mockUSDC = await hre.viem.deployContract("MockERC20", [
            "Mock USDC",
            "USDC",
            6n,
        ]);

        // Deploy IdleStrategy
        const idleStrategy = await hre.viem.deployContract("IdleStrategy", [
            mockUSDC.address,
            vault.account.address,
        ]);

        // Mint USDC to vault for testing
        const mintAmount = parseUnits("10000", 6);
        await mockUSDC.write.mint([vault.account.address, mintAmount]);

        return {
            idleStrategy,
            mockUSDC,
            owner,
            vault,
            user1,
            attacker,
        };
    }

    describe("Deployment", function () {
        it("Should set the correct asset", async function () {
            const { idleStrategy, mockUSDC } = await deployIdleStrategyFixture();
            expect(await idleStrategy.read.asset()).to.equal(mockUSDC.address);
        });

        it("Should set the correct vault", async function () {
            const { idleStrategy, vault } = await deployIdleStrategyFixture();
            expect(await idleStrategy.read.vault()).to.equal(vault.account.address);
        });

        it("Should set deployer as owner", async function () {
            const { idleStrategy, owner } = await deployIdleStrategyFixture();
            expect(await idleStrategy.read.owner()).to.equal(owner.account.address);
        });
    });

    describe("Deposit", function () {
        it("Should allow vault to deposit USDC", async function () {
            const { idleStrategy, mockUSDC, vault } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("1000", 6);

            // Approve strategy to spend USDC
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });

            // Deposit
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Check balance
            const balance = await mockUSDC.read.balanceOf([idleStrategy.address]);
            expect(balance).to.equal(depositAmount);
        });
    });

    describe("Withdraw", function () {
        it("Should allow vault to withdraw USDC", async function () {
            const { idleStrategy, mockUSDC, vault } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("1000", 6);

            // Deposit first
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Get vault balance before withdrawal
            const balanceBefore = await mockUSDC.read.balanceOf([vault.account.address]);

            // Withdraw
            await idleStrategy.write.withdraw([depositAmount], {
                account: vault.account,
            });

            // Check vault received USDC
            const balanceAfter = await mockUSDC.read.balanceOf([vault.account.address]);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount);

            // Check strategy balance is zero
            expect(await mockUSDC.read.balanceOf([idleStrategy.address])).to.equal(0n);
        });

        it("Should return partial amount when insufficient balance", async function () {
            const { idleStrategy, mockUSDC, vault } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("500", 6);
            const withdrawAmount = parseUnits("1000", 6);

            // Deposit 500
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Try to withdraw 1000 (should return 500)
            const balanceBefore = await mockUSDC.read.balanceOf([vault.account.address]);

            await idleStrategy.write.withdraw([withdrawAmount], {
                account: vault.account,
            });

            const balanceAfter = await mockUSDC.read.balanceOf([vault.account.address]);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount); // Only 500 returned
        });
    });

    describe("TotalAssets", function () {
        it("Should return correct total assets", async function () {
            const { idleStrategy, mockUSDC, vault } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("1000", 6);

            // Initially should be zero
            expect(await idleStrategy.read.totalAssets()).to.equal(0n);

            // Deposit
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Should equal deposit amount
            expect(await idleStrategy.read.totalAssets()).to.equal(depositAmount);
        });

        it("Should return real balance from balanceOf", async function () {
            const { idleStrategy, mockUSDC, vault } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            const totalAssets = await idleStrategy.read.totalAssets();
            const actualBalance = await mockUSDC.read.balanceOf([idleStrategy.address]);

            expect(totalAssets).to.equal(actualBalance);
        });
    });

    describe("Emergency Withdraw", function () {
        it("Should allow owner to emergency withdraw", async function () {
            const { idleStrategy, mockUSDC, vault, owner } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("1000", 6);

            // Deposit
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Emergency withdraw
            const ownerBalanceBefore = await mockUSDC.read.balanceOf([owner.account.address]);

            await idleStrategy.write.emergencyWithdraw({
                account: owner.account,
            });

            const ownerBalanceAfter = await mockUSDC.read.balanceOf([owner.account.address]);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(depositAmount);

            // Strategy should be empty
            expect(await mockUSDC.read.balanceOf([idleStrategy.address])).to.equal(0n);
        });
    });

    describe("Anti-Mock Compliance", function () {
        it("Should hold real tokens, not simulated balance", async function () {
            const { idleStrategy, mockUSDC, vault } = await deployIdleStrategyFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Verify actual token balance matches totalAssets
            const actualBalance = await mockUSDC.read.balanceOf([idleStrategy.address]);
            const reportedAssets = await idleStrategy.read.totalAssets();

            expect(actualBalance).to.equal(reportedAssets);
            expect(actualBalance).to.equal(depositAmount);
        });
    });
});
