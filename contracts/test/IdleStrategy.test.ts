import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

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
            const { idleStrategy, mockUSDC } = await loadFixture(deployIdleStrategyFixture);
            expect((await idleStrategy.read.asset()).toLowerCase()).to.equal(mockUSDC.address.toLowerCase());
        });

        it("Should set the correct vault", async function () {
            const { idleStrategy, vault } = await loadFixture(deployIdleStrategyFixture);
            expect((await idleStrategy.read.vault()).toLowerCase()).to.equal(vault.account.address.toLowerCase());
        });

        it("Should set deployer as owner", async function () {
            const { idleStrategy, owner } = await loadFixture(deployIdleStrategyFixture);
            expect((await idleStrategy.read.owner()).toLowerCase()).to.equal(owner.account.address.toLowerCase());
        });

        it("Should have zero total assets initially", async function () {
            const { idleStrategy } = await loadFixture(deployIdleStrategyFixture);
            expect(await idleStrategy.read.totalAssets()).to.equal(0n);
        });
    });

    describe("Deposit", function () {
        it("Should allow vault to deposit USDC", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });

            // Act
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Assert
            const balance = await mockUSDC.read.balanceOf([idleStrategy.address]);
            expect(balance).to.equal(depositAmount);
        });

        it("Should revert on zero amount deposit", async function () {
            // Arrange
            const { idleStrategy, vault } = await loadFixture(deployIdleStrategyFixture);

            // Act & Assert
            await expect(
                idleStrategy.write.deposit([0n], {
                    account: vault.account,
                })
            ).to.be.rejected;
        });

        it("Should revert when non-vault tries to deposit", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, user1 } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.mint([user1.account.address, depositAmount]);
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: user1.account,
            });

            // Act & Assert
            await expect(
                idleStrategy.write.deposit([depositAmount], {
                    account: user1.account,
                })
            ).to.be.rejected;
        });

        it("Should transfer real tokens to strategy", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });

            const balanceBefore = await mockUSDC.read.balanceOf([vault.account.address]);

            // Act
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Assert - Verify real token transfer (anti-mock)
            const balanceAfter = await mockUSDC.read.balanceOf([vault.account.address]);
            expect(balanceBefore - balanceAfter).to.equal(depositAmount);

            const strategyBalance = await mockUSDC.read.balanceOf([idleStrategy.address]);
            expect(strategyBalance).to.equal(depositAmount);
        });
    });

    describe("Withdraw", function () {
        it("Should allow vault to withdraw USDC", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            const balanceBefore = await mockUSDC.read.balanceOf([vault.account.address]);

            // Act
            await idleStrategy.write.withdraw([depositAmount], {
                account: vault.account,
            });

            // Assert
            const balanceAfter = await mockUSDC.read.balanceOf([vault.account.address]);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount);
            expect(await mockUSDC.read.balanceOf([idleStrategy.address])).to.equal(0n);
        });

        it("Should return partial amount when insufficient balance", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("500", 6);
            const withdrawAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            const balanceBefore = await mockUSDC.read.balanceOf([vault.account.address]);

            // Act
            await idleStrategy.write.withdraw([withdrawAmount], {
                account: vault.account,
            });

            // Assert
            const balanceAfter = await mockUSDC.read.balanceOf([vault.account.address]);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount); // Only 500 returned
        });

        it("Should revert on zero amount withdrawal", async function () {
            // Arrange
            const { idleStrategy, vault } = await loadFixture(deployIdleStrategyFixture);

            // Act & Assert
            await expect(
                idleStrategy.write.withdraw([0n], {
                    account: vault.account,
                })
            ).to.be.rejected;
        });

        it("Should revert when non-vault tries to withdraw", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault, user1 } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Act & Assert
            await expect(
                idleStrategy.write.withdraw([depositAmount], {
                    account: user1.account,
                })
            ).to.be.rejected;
        });
    });

    describe("TotalAssets", function () {
        it("Should return correct total assets", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            // Initially should be zero
            expect(await idleStrategy.read.totalAssets()).to.equal(0n);

            // Act - Deposit
            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Assert
            expect(await idleStrategy.read.totalAssets()).to.equal(depositAmount);
        });

        it("Should return real balance from balanceOf", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Act
            const totalAssets = await idleStrategy.read.totalAssets();
            const actualBalance = await mockUSDC.read.balanceOf([idleStrategy.address]);

            // Assert
            expect(totalAssets).to.equal(actualBalance);
        });

        it("Should update after multiple deposits and withdrawals", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);

            // Act - Multiple operations
            await mockUSDC.write.approve([idleStrategy.address, parseUnits("5000", 6)], {
                account: vault.account,
            });

            await idleStrategy.write.deposit([parseUnits("1000", 6)], {
                account: vault.account,
            });
            expect(await idleStrategy.read.totalAssets()).to.equal(parseUnits("1000", 6));

            await idleStrategy.write.deposit([parseUnits("500", 6)], {
                account: vault.account,
            });
            expect(await idleStrategy.read.totalAssets()).to.equal(parseUnits("1500", 6));

            await idleStrategy.write.withdraw([parseUnits("300", 6)], {
                account: vault.account,
            });
            expect(await idleStrategy.read.totalAssets()).to.equal(parseUnits("1200", 6));
        });
    });

    describe("Emergency Withdraw", function () {
        it("Should allow owner to emergency withdraw", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault, owner } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            const ownerBalanceBefore = await mockUSDC.read.balanceOf([owner.account.address]);

            // Act
            await idleStrategy.write.emergencyWithdraw({
                account: owner.account,
            });

            // Assert
            const ownerBalanceAfter = await mockUSDC.read.balanceOf([owner.account.address]);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(depositAmount);
            expect(await mockUSDC.read.balanceOf([idleStrategy.address])).to.equal(0n);
        });

        it("Should revert when non-owner tries emergency withdraw", async function () {
            // Arrange
            const { idleStrategy, user1 } = await loadFixture(deployIdleStrategyFixture);

            // Act & Assert
            await expect(
                idleStrategy.write.emergencyWithdraw({
                    account: user1.account,
                })
            ).to.be.rejected;
        });
    });

    describe("Anti-Mock Compliance", function () {
        it("Should hold real tokens, not simulated balance", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });

            // Act
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            // Assert - Verify actual token balance matches totalAssets
            const actualBalance = await mockUSDC.read.balanceOf([idleStrategy.address]);
            const reportedAssets = await idleStrategy.read.totalAssets();

            expect(actualBalance).to.equal(reportedAssets);
            expect(actualBalance).to.equal(depositAmount);
        });

        it("Should never generate yield (0% APY is real)", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([idleStrategy.address, depositAmount], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([depositAmount], {
                account: vault.account,
            });

            const assetsBefore = await idleStrategy.read.totalAssets();

            // Act - Wait (simulate time passing - though no actual time-based logic)
            // In real scenario, time would pass but idle strategy generates 0% yield

            // Assert - Assets remain exactly the same (no phantom yield)
            const assetsAfter = await idleStrategy.read.totalAssets();
            expect(assetsAfter).to.equal(assetsBefore);
            expect(assetsAfter).to.equal(depositAmount);
        });
    });

    describe("Invariants", function () {
        it("Invariant: totalAssets() always equals balanceOf(strategy)", async function () {
            // Arrange
            const { idleStrategy, mockUSDC, vault } = await loadFixture(deployIdleStrategyFixture);

            // Test at various states
            expect(await idleStrategy.read.totalAssets()).to.equal(
                await mockUSDC.read.balanceOf([idleStrategy.address])
            );

            // After deposit
            await mockUSDC.write.approve([idleStrategy.address, parseUnits("1000", 6)], {
                account: vault.account,
            });
            await idleStrategy.write.deposit([parseUnits("1000", 6)], {
                account: vault.account,
            });

            expect(await idleStrategy.read.totalAssets()).to.equal(
                await mockUSDC.read.balanceOf([idleStrategy.address])
            );

            // After withdrawal
            await idleStrategy.write.withdraw([parseUnits("400", 6)], {
                account: vault.account,
            });

            expect(await idleStrategy.read.totalAssets()).to.equal(
                await mockUSDC.read.balanceOf([idleStrategy.address])
            );
        });
    });
});