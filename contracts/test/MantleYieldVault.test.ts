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

        // Deploy IdleStrategy
        const idleStrategy = await hre.viem.deployContract("IdleStrategy", [
            mockUSDC.address,
            vault.address,
        ]);

        // Add IdleStrategy to vault with 1M USDC cap
        const strategyCap = parseUnits("1000000", 6);
        await vault.write.addStrategy([idleStrategy.address, strategyCap]);

        // Mint USDC to users for testing
        const mintAmount = parseUnits("10000", 6); // 10,000 USDC each
        await mockUSDC.write.mint([user1.account.address, mintAmount]);
        await mockUSDC.write.mint([user2.account.address, mintAmount]);
        await mockUSDC.write.mint([attacker.account.address, mintAmount]);

        return {
            vault,
            mockUSDC,
            idleStrategy,
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
            expect(await vault.read.asset()).to.equal(mockUSDC.address);
        });

        it("Should set the correct name and symbol", async function () {
            const { vault } = await deployVaultFixture();
            expect(await vault.read.name()).to.equal("MantleYield USDC");
            expect(await vault.read.symbol()).to.equal("myUSDC");
        });

        it("Should set deployer as owner and operator", async function () {
            const { vault, owner } = await deployVaultFixture();
            expect(await vault.read.owner()).to.equal(owner.account.address);
            expect(await vault.read.operator()).to.equal(owner.account.address);
        });
    });

    describe("Deposit", function () {
        it("Should allow user to deposit USDC", async function () {
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            // Approve vault to spend USDC
            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            // Deposit
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Check shares received (should be 1:1 for first deposit)
            const shares = await vault.read.balanceOf([user1.account.address]);
            expect(shares).to.equal(depositAmount);
        });

        it("Should update totalAssets correctly", async function () {
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });

            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            expect(await vault.read.totalAssets()).to.equal(depositAmount);
        });
    });

    describe("Withdraw", function () {
        it("Should allow user to withdraw USDC", async function () {
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            // Deposit first
            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Get initial balance
            const balanceBefore = await mockUSDC.read.balanceOf([user1.account.address]);

            // Withdraw
            await vault.write.withdraw([depositAmount, user1.account.address, user1.account.address], {
                account: user1.account,
            });

            // Check USDC returned
            const balanceAfter = await mockUSDC.read.balanceOf([user1.account.address]);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount);

            // Check shares burned
            expect(await vault.read.balanceOf([user1.account.address])).to.equal(0n);
        });

        it("Should work even when paused", async function () {
            const { vault, mockUSDC, user1, owner } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            // Deposit
            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            // Pause vault
            await vault.write.pause({ account: owner.account });

            // Withdraw should still work
            await vault.write.withdraw([depositAmount, user1.account.address, user1.account.address], {
                account: user1.account,
            });

            expect(await vault.read.balanceOf([user1.account.address])).to.equal(0n);
        });
    });

    describe("ERC-4626 Compliance", function () {
        it("Should return correct maxDeposit when not paused", async function () {
            const { vault, user1 } = await deployVaultFixture();
            const maxDeposit = await vault.read.maxDeposit([user1.account.address]);
            expect(maxDeposit).to.equal(2n ** 256n - 1n); // max uint256
        });

        it("Should return 0 for maxDeposit when paused", async function () {
            const { vault, user1, owner } = await deployVaultFixture();

            await vault.write.pause({ account: owner.account });

            const maxDeposit = await vault.read.maxDeposit([user1.account.address]);
            expect(maxDeposit).to.equal(0n);
        });

        it("Should return correct maxWithdraw", async function () {
            const { vault, mockUSDC, user1 } = await deployVaultFixture();
            const depositAmount = parseUnits("1000", 6);

            await mockUSDC.write.approve([vault.address, depositAmount], {
                account: user1.account,
            });
            await vault.write.deposit([depositAmount, user1.account.address], {
                account: user1.account,
            });

            const maxWithdraw = await vault.read.maxWithdraw([user1.account.address]);
            expect(maxWithdraw).to.equal(depositAmount);
        });
    });

    describe("Access Control", function () {
        it("Should allow owner to set operator", async function () {
            const { vault, operator, owner } = await deployVaultFixture();

            await vault.write.setOperator([operator.account.address], {
                account: owner.account,
            });

            expect(await vault.read.operator()).to.equal(operator.account.address);
        });

        it("Should allow operator to pause", async function () {
            const { vault, owner } = await deployVaultFixture();

            await vault.write.pause({ account: owner.account });
            expect(await vault.read.paused()).to.be.true;
        });
    });
});
