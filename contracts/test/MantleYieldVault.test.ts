import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";

describe("MantleYieldVault", function () {
    // Fixture to deploy contracts
    async function deployVaultFixture() {
        const [owner, operator, user1, user2, attacker] = await hre.viem.getWalletClients();
        const publicClient = await hre.viem.getPublicClient();

        // Deploy MockERC20 (USDC with 6 decimals)
        const mockUSDC = await hre.viem.deployContract("MockERC20", [
            "Mock USDC",
            "USDC",
            6n,
        ]);

        // Deploy MantleYieldVault
        const vault = await hre.viem.deployContract("MantleYieldVault", [
            mockUSDC.address,
            "MantleYield USDC",
            "myUSDC",
        ]);

        // Deploy IdleStrategy 1
        const idleStrategy = await hre.viem.deployContract("IdleStrategy", [
            mockUSDC.address,
            vault.address,
        ]);

        // Deploy IdleStrategy 2 (for rebalance testing)
        const idleStrategy2 = await hre.viem.deployContract("IdleStrategy", [
            mockUSDC.address,
            vault.address,
        ]);

        // Add strategies to vault with caps
        const strategyCap = parseUnits("1000000", 6);
        await vault.write.addStrategy([idleStrategy.address, strategyCap]);
        await vault.write.addStrategy([idleStrategy2.address, strategyCap]);

        // Mint USDC to users for testing
        const mintAmount = parseUnits("10000", 6); // 10,000 USDC each
        await mockUSDC.write.mint([user1.account.address, mintAmount]);
        await mockUSDC.write.mint([user2.account.address, mintAmount]);
        await mockUSDC.write.mint([attacker.account.address, mintAmount]);

        return {
            vault,
            mockUSDC,
            idleStrategy,
            idleStrategy2,
            owner,
            operator,
            user1,
            user2,
            attacker,
            publicClient,
        };
    }

    describe("Deployment", function () {
        it("Should set the correct asset", async function () {
            const { vault, mockUSDC } = await deployVaultFixture();
            expect((await vault.read.asset()).toLowerCase()).to.equal(mockUSDC.address.toLowerCase());
        });

        it("Should set the correct name and symbol", async function () {
            const { vault } = await deployVaultFixture();
            expect(await vault.read.name()).to.equal("MantleYield USDC");
            expect(await vault.read.symbol()).to.equal("myUSDC");
        });

        it("Should set deployer as owner and operator", async function () {
            const { vault, owner } = await deployVaultFixture();
            expect((await vault.read.owner()).toLowerCase()).to.equal(owner.account.address.toLowerCase());
            expect((await vault.read.operator()).toLowerCase()).to.equal(owner.account.address.toLowerCase());
        });

        it("Should have zero total assets initially", async function () {
            const { vault } = await deployVaultFixture();
            expect(await vault.read.totalAssets()).to.equal(0n);
        });

        it("Should have zero total supply initially", async function () {
            const { vault } = await deployVaultFixture();
            expect(await vault.read.totalSupply()).to.equal(0n);
        });
    });

    describe("Deposit", function () {
        it("Should allow user to deposit USDC", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            // Act
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Assert
            const shares = await vault.read.balanceOf([user1.account.address]);
            expect(shares).to.equal(depositAmount);
        });

        it("Should update totalAssets correctly", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            // Act
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Assert
            expect(await vault.read.totalAssets()).to.equal(depositAmount);
        });

        it("Should revert on zero amount deposit", async function () {
            // Arrange
            const { vault, user1 } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.deposit([0n, user1.account.address], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("ZeroAmount");
        });

        it("Should revert on deposit to zero address", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            // Act & Assert
            await expect(
                vault.write.deposit([depositAmount, "0x0000000000000000000000000000000000000000"], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("ZeroAddress");
        });

        it("Should revert when paused", async function () {
            // Arrange
            const { vault, mockUSDC, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            await vault.write.pause({ account: owner.account });

            // Act & Assert
            await expect(
                vault.write.deposit([depositAmount, user1.account.address], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("EnforcedPause");
        });

        it("Should handle multiple deposits correctly", async function () {
            // Arrange
            const { vault, mockUSDC, user1, user2 } = await deployVaultFixture();
            const deposit1 = parseUnits("1000", 6);
            const deposit2 = parseUnits("500", 6);

            // Act - First deposit
            await mockUSDC.write.approve([vault.address, deposit1], {
                account: user1.account,
            });
            await vault.write.deposit([deposit1, user1.account.address], {
                account: user1.account,
            });

            // Act - Second deposit
            await mockUSDC.write.approve([vault.address, deposit2], {
                account: user2.account,
            });
            await vault.write.deposit([deposit2, user2.account.address], {
                account: user2.account,
            });

            // Assert
            expect(await vault.read.totalAssets()).to.equal(deposit1 + deposit2);
            expect(await vault.read.balanceOf([user1.account.address])).to.equal(deposit1);
            expect(await vault.read.balanceOf([user2.account.address])).to.equal(deposit2);
        });

        it("Should transfer real tokens from user to vault", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            const balanceBefore = await mockUSDC.read.balanceOf([user1.account.address]);

            // Act
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Assert - Verify real token transfer (anti-mock)
            const balanceAfter = await mockUSDC.read.balanceOf([user1.account.address]);
            expect(balanceBefore - balanceAfter).to.equal(depositAmount);

            const vaultBalance = await mockUSDC.read.balanceOf([vault.address]);
            expect(vaultBalance).to.equal(depositAmount);
        });
    });

    describe("Withdraw", function () {
        it("Should allow user to withdraw USDC", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            const balanceBefore = await mockUSDC.read.balanceOf([user1.account.address]);

            // Act
            await vault.write.withdraw([depositAmount, user1.account.address, user1.account.address], {
                account: user1.account,
            });

            // Assert
            const balanceAfter = await mockUSDC.read.balanceOf([user1.account.address]);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount);
            expect(await vault.read.balanceOf([user1.account.address])).to.equal(0n);
        });

        it("Should work even when paused (critical safety property)", async function () {
            // Arrange
            const { vault, mockUSDC, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            await vault.write.pause({ account: owner.account });

            // Act
            await vault.write.withdraw([depositAmount, user1.account.address, user1.account.address], {
                account: user1.account,
            });

            // Assert
            expect(await vault.read.balanceOf([user1.account.address])).to.equal(0n);
        });

        it("Should revert on zero amount withdrawal", async function () {
            // Arrange
            const { vault, user1 } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.withdraw([0n, user1.account.address, user1.account.address], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("ZeroAmount");
        });

        it("Should revert on withdraw to zero address", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Act & Assert
            await expect(
                vault.write.withdraw([depositAmount, "0x0000000000000000000000000000000000000000", user1.account.address], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("ZeroAddress");
        });

        it("Should withdraw from strategy when vault has insufficient idle balance", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            // Deposit
            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Impersonate vault to transfer funds to strategy
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            // Verify vault has no idle balance
            expect(await mockUSDC.read.balanceOf([vault.address])).to.equal(0n);

            // Act - Withdraw should pull from strategy
            await vault.write.withdraw([depositAmount, user1.account.address, user1.account.address], {
                account: user1.account,
            });

            // Assert
            expect(await vault.read.balanceOf([user1.account.address])).to.equal(0n);
        });
    });

    describe("Rebalance", function () {
        it("Should allow operator to rebalance between strategies", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, idleStrategy2, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Impersonate vault to transfer funds to strategy
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            const rebalanceAmount = parseUnits("500", 6);

            // Act - Rebalance from strategy1 to strategy2
            await vault.write.rebalance([idleStrategy.address, idleStrategy2.address, rebalanceAmount], {
                account: owner.account,
            });

            // Assert
            expect(await idleStrategy.read.totalAssets()).to.equal(parseUnits("500", 6));
            expect(await idleStrategy2.read.totalAssets()).to.equal(rebalanceAmount);
        });

        it("Should maintain total assets invariant during rebalance", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, idleStrategy2, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Impersonate vault to transfer funds to strategy
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            const totalBefore = await vault.read.totalAssets();

            // Act - Rebalance between strategies
            await vault.write.rebalance([idleStrategy.address, idleStrategy2.address, parseUnits("500", 6)], {
                account: owner.account,
            });

            // Assert - Critical invariant
            const totalAfter = await vault.read.totalAssets();
            expect(totalAfter).to.equal(totalBefore);
        });

        it("Should revert when non-operator tries to rebalance", async function () {
            // Arrange
            const { vault, idleStrategy, idleStrategy2, user1 } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.rebalance([idleStrategy.address, idleStrategy2.address, parseUnits("100", 6)], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("NotOperator");
        });

        it("Should revert on zero amount rebalance", async function () {
            // Arrange
            const { vault, idleStrategy, idleStrategy2, owner } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.rebalance([idleStrategy.address, idleStrategy2.address, 0n], {
                    account: owner.account,
                })
            ).to.be.rejectedWith("ZeroAmount");
        });

        it("Should revert when paused", async function () {
            // Arrange
            const { vault, idleStrategy, idleStrategy2, owner } = await deployVaultFixture();

            await vault.write.pause({ account: owner.account });

            // Act & Assert
            await expect(
                vault.write.rebalance([idleStrategy.address, idleStrategy2.address, parseUnits("100", 6)], {
                    account: owner.account,
                })
            ).to.be.rejectedWith("EnforcedPause");
        });

        it("Should revert when exceeding strategy cap", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, idleStrategy2, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("2000000", 6); // 2M USDC

            await mockUSDC.write.mint([user1.account.address, depositAmount]);
            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Impersonate vault to transfer funds to strategy
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            // Act & Assert - Try to exceed 1M cap on strategy2
            await expect(
                vault.write.rebalance([idleStrategy.address, idleStrategy2.address, parseUnits("1500000", 6)], {
                    account: owner.account,
                })
            ).to.be.rejectedWith("ExceedsAllocationCap");
        });

        it("Should revert when rebalancing to same strategy", async function () {
            // Arrange
            const { vault, idleStrategy, owner } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.rebalance([idleStrategy.address, idleStrategy.address, parseUnits("100", 6)], {
                    account: owner.account,
                })
            ).to.be.rejectedWith("SameStrategy");
        });
    });

    describe("Strategy Management", function () {
        it("Should allow owner to add strategy", async function () {
            // Arrange
            const { vault, mockUSDC, owner } = await deployVaultFixture();

            const newStrategy = await hre.viem.deployContract("IdleStrategy", [
                mockUSDC.address,
                vault.address,
            ]);

            // Act
            await vault.write.addStrategy([newStrategy.address, parseUnits("500000", 6)], {
                account: owner.account,
            });

            // Assert
            expect(await vault.read.isStrategy([newStrategy.address])).to.be.true;
            expect(await vault.read.strategyCap([newStrategy.address])).to.equal(parseUnits("500000", 6));
        });

        it("Should revert when non-owner tries to add strategy", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();

            const newStrategy = await hre.viem.deployContract("IdleStrategy", [
                mockUSDC.address,
                vault.address,
            ]);

            // Act & Assert
            await expect(
                vault.write.addStrategy([newStrategy.address, parseUnits("500000", 6)], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("OwnableUnauthorizedAccount");
        });

        it("Should revert when adding duplicate strategy", async function () {
            // Arrange
            const { vault, idleStrategy, owner } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.addStrategy([idleStrategy.address, parseUnits("500000", 6)], {
                    account: owner.account,
                })
            ).to.be.rejectedWith("StrategyAlreadyExists");
        });

        it("Should allow owner to update strategy cap", async function () {
            // Arrange
            const { vault, idleStrategy, owner } = await deployVaultFixture();
            const newCap = parseUnits("2000000", 6);

            // Act
            await vault.write.updateStrategyCap([idleStrategy.address, newCap], {
                account: owner.account,
            });

            // Assert
            expect(await vault.read.strategyCap([idleStrategy.address])).to.equal(newCap);
        });
    });

    describe("Access Control", function () {
        it("Should allow owner to set operator", async function () {
            // Arrange
            const { vault, operator, owner } = await deployVaultFixture();

            // Act
            await vault.write.setOperator([operator.account.address], {
                account: owner.account,
            });

            // Assert
            expect((await vault.read.operator()).toLowerCase()).to.equal(operator.account.address.toLowerCase());
        });

        it("Should revert when non-owner tries to set operator", async function () {
            // Arrange
            const { vault, operator, user1 } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.setOperator([operator.account.address], {
                    account: user1.account,
                })
            ).to.be.rejectedWith("OwnableUnauthorizedAccount");
        });

        it("Should revert when setting operator to zero address", async function () {
            // Arrange
            const { vault, owner } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.setOperator(["0x0000000000000000000000000000000000000000"], {
                    account: owner.account,
                })
            ).to.be.rejectedWith("InvalidOperator");
        });

        it("Should allow operator to pause", async function () {
            // Arrange
            const { vault, owner } = await deployVaultFixture();

            // Act
            await vault.write.pause({ account: owner.account });

            // Assert
            expect(await vault.read.paused()).to.be.true;
        });

        it("Should allow owner to unpause", async function () {
            // Arrange
            const { vault, owner } = await deployVaultFixture();

            await vault.write.pause({ account: owner.account });

            // Act
            await vault.write.unpause({ account: owner.account });

            // Assert
            expect(await vault.read.paused()).to.be.false;
        });

        it("Should revert when non-operator tries to pause", async function () {
            // Arrange
            const { vault, user1 } = await deployVaultFixture();

            // Act & Assert
            await expect(
                vault.write.pause({ account: user1.account })
            ).to.be.rejectedWith("NotOperator");
        });
    });

    describe("ERC-4626 Compliance", function () {
        it("Should return correct maxDeposit when not paused", async function () {
            // Arrange
            const { vault, user1 } = await deployVaultFixture();

            // Act
            const maxDeposit = await vault.read.maxDeposit([user1.account.address]);

            // Assert
            expect(maxDeposit).to.equal(2n ** 256n - 1n);
        });

        it("Should return 0 for maxDeposit when paused", async function () {
            // Arrange
            const { vault, user1, owner } = await deployVaultFixture();

            await vault.write.pause({ account: owner.account });

            // Act
            const maxDeposit = await vault.read.maxDeposit([user1.account.address]);

            // Assert
            expect(maxDeposit).to.equal(0n);
        });

        it("Should return correct maxWithdraw", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Act
            const maxWithdraw = await vault.read.maxWithdraw([user1.account.address]);

            // Assert
            expect(maxWithdraw).to.equal(depositAmount);
        });

        it("Should return correct maxMint when not paused", async function () {
            // Arrange
            const { vault, user1 } = await deployVaultFixture();

            // Act
            const maxMint = await vault.read.maxMint([user1.account.address]);

            // Assert
            expect(maxMint).to.equal(2n ** 256n - 1n);
        });

        it("Should return 0 for maxMint when paused", async function () {
            // Arrange
            const { vault, user1, owner } = await deployVaultFixture();

            await vault.write.pause({ account: owner.account });

            // Act
            const maxMint = await vault.read.maxMint([user1.account.address]);

            // Assert
            expect(maxMint).to.equal(0n);
        });
    });

    describe("Anti-Mock Compliance", function () {
        it("Should hold real tokens, not simulated balance", async function () {
            // Arrange
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            // Act
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Assert - Verify actual token balance matches totalAssets
            const actualBalance = await mockUSDC.read.balanceOf([vault.address]);
            const reportedAssets = await vault.read.totalAssets();

            expect(actualBalance).to.equal(reportedAssets);
            expect(actualBalance).to.equal(depositAmount);
        });

        it("Should aggregate real balances from strategies", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, idleStrategy2, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // First transfer funds to strategy, then rebalance between strategies
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            // Now rebalance half from strategy to idleStrategy2
            const rebalanceAmount = parseUnits("500", 6);
            await vault.write.rebalance([idleStrategy.address, idleStrategy2.address, rebalanceAmount], {
                account: owner.account,
            });

            // Act
            const totalAssets = await vault.read.totalAssets();
            const vaultBalance = await mockUSDC.read.balanceOf([vault.address]);
            const strategy1Balance = await mockUSDC.read.balanceOf([idleStrategy.address]);
            const strategy2Balance = await mockUSDC.read.balanceOf([idleStrategy2.address]);

            // Assert - totalAssets = sum of real balances
            expect(totalAssets).to.equal(vaultBalance + strategy1Balance + strategy2Balance);
            expect(totalAssets).to.equal(depositAmount);
        });
    });

    describe("Invariants", function () {
        it("Invariant: Total assets should equal sum of vault idle + strategy balances", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, idleStrategy2, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Impersonate vault to transfer funds to strategy
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            // Act - Rebalance between strategies
            await vault.write.rebalance([idleStrategy.address, idleStrategy2.address, parseUnits("300", 6)], {
                account: owner.account,
            });

            // Assert
            const totalAssets = await vault.read.totalAssets();
            const idleBalance = await vault.read.idleBalance();
            const strategy1Balance = await idleStrategy.read.totalAssets();
            const strategy2Balance = await idleStrategy2.read.totalAssets();

            expect(totalAssets).to.equal(idleBalance + strategy1Balance + strategy2Balance);
        });

        it("Invariant: Rebalance should never change total assets", async function () {
            // Arrange
            const { vault, mockUSDC, idleStrategy, idleStrategy2, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Impersonate vault to transfer funds to strategy
            // Set balance for vault to pay gas fees
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [vault.address, "0xDE0B6B3A7640000"], // 1 ETH in hex
            });
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [vault.address],
            });
            const vaultSigner = await hre.viem.getWalletClient(vault.address);
            await mockUSDC.write.transfer([idleStrategy.address, depositAmount], {
                account: vaultSigner.account,
            });
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [vault.address],
            });

            const totalBefore = await vault.read.totalAssets();

            // Act - Multiple rebalances
            await vault.write.rebalance([idleStrategy.address, idleStrategy2.address, parseUnits("400", 6)], {
                account: owner.account,
            });
            await vault.write.rebalance([idleStrategy2.address, idleStrategy.address, parseUnits("200", 6)], {
                account: owner.account,
            });

            // Assert
            const totalAfter = await vault.read.totalAssets();
            expect(totalAfter).to.equal(totalBefore);
        });

        it("Invariant: User can always withdraw their proportional share", async function () {
            // Arrange
            const { vault, mockUSDC, user1, user2 } = await deployVaultFixture();
            const deposit1 = parseUnits("1000", 6);
            const deposit2 = parseUnits("500", 6);

            await mockUSDC.write.approve([vault.address, deposit1], {
                account: user1.account,
            });
            await vault.write.deposit([deposit1, user1.account.address], {
                account: user1.account,
            });

            await mockUSDC.write.approve([vault.address, deposit2], {
                account: user2.account,
            });
            await vault.write.deposit([deposit2, user2.account.address], {
                account: user2.account,
            });

            // Act - User1 withdraws
            const balanceBefore = await mockUSDC.read.balanceOf([user1.account.address]);
            await vault.write.withdraw([deposit1, user1.account.address, user1.account.address], {
                account: user1.account,
            });
            const balanceAfter = await mockUSDC.read.balanceOf([user1.account.address]);

            // Assert
            expect(balanceAfter - balanceBefore).to.equal(deposit1);
        });
    });
});