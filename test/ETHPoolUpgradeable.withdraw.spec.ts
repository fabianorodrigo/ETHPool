import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {getImplementationAddress} from "@openzeppelin/upgrades-core";
import {expect} from "chai";
import {ethers, network} from "hardhat";
import {
  ETHPoolUpgradeable,
  ETHPoolUpgradeable__factory,
} from "../typechain-types";
import {deployETHPoolUpgradeableFixture} from "./shared/fixtureUpgradeable";
import {UtilsTest} from "./Utils";

describe("ETHPoolUpgradeable", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolUpgradeableFixture;

  describe("Withdraw", function () {
    describe("Validations", function () {
      it("Should revert if some user without balance tries to withdraw when there isn't any active user", async function () {
        const {ethPoolProxy, accountA} = await loadFixture(ETHPoolFixture);

        await expect(
          ethPoolProxy.connect(accountA).withdraw()
        ).to.be.revertedWithCustomError(ethPoolProxy, "ZeroBalance");
      });
      it("Should revert if some user without balance tries to withdraw", async function () {
        const {ethPoolProxy, accountA, accountD} = await loadFixture(
          ETHPoolFixture
        );

        const randomAmount = UtilsTest.getRandomAmount();
        await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: randomAmount,
        });

        await expect(
          ethPoolProxy.connect(accountA).withdraw()
        ).to.be.revertedWithCustomError(ethPoolProxy, "ZeroBalance");
      });
      it(`Should revert if try to withdraw direct from the implementation contract is spite of the proxy contract`, async function () {
        const {ethPoolProxy, accountA} = await loadFixture(ETHPoolFixture);
        const implementationAddress = await getImplementationAddress(
          network.provider,
          ethPoolProxy.address
        );
        const ETHPoolUpgradeableFactory: ETHPoolUpgradeable__factory =
          await ethers.getContractFactory(`ETHPoolUpgradeable`);
        const ethPool: ETHPoolUpgradeable = ETHPoolUpgradeableFactory.attach(
          implementationAddress
        );

        await expect(ethPool.connect(accountA).withdraw()).to.be.revertedWith(
          "Function must be called through delegatecall"
        );
      });
    });
    describe("Events", function () {
      it("Should emit an event on Withdrawal", async function () {
        const {ethPoolProxy, accountD} = await loadFixture(ETHPoolFixture);

        const randomAmount = UtilsTest.getRandomAmount();
        const receipt = await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: randomAmount,
        });
        //await receipt.wait();

        await expect(ethPoolProxy.connect(accountD).withdraw())
          .to.emit(ethPoolProxy, "Withdrawal")
          .withArgs(accountD.address, randomAmount);
      });
    });
    describe("State", function () {
      it("Should the user withdraw only the deposited value when there is no rewards after its deposit", async function () {
        const {ethPoolProxy, accountA, accountB, accountD, teamMember} =
          await loadFixture(ETHPoolFixture);

        ///// DEPOSITS FROM accountB AND accountA
        const randomAmountA = UtilsTest.getRandomAmount();
        const randomAmountB = UtilsTest.getRandomAmount();

        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: randomAmountB,
        });
        await accountA.sendTransaction({
          to: ethPoolProxy.address,
          value: randomAmountA,
        });

        const initialPoolBalance = randomAmountA + randomAmountB;

        // DEPOSIT REWARD FROM teamMember
        const randomReward = UtilsTest.getRandomAmount();
        await ethPoolProxy
          .connect(teamMember)
          .depositReward({value: randomReward});

        ///// DEPOSIT FROM accountD
        const randomAmountD = UtilsTest.getRandomAmount();
        await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: randomAmountD,
        });

        // users balance
        // User balance (Division always truncates, it just maps to the DIV opcode of the EVM)
        const balanceA =
          randomAmountA +
          Math.floor((randomReward * randomAmountA) / initialPoolBalance);
        const balanceB =
          randomAmountB +
          Math.floor((randomReward * randomAmountB) / initialPoolBalance);
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          balanceA
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          balanceB
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          randomAmountD
        );

        ////// WITHDRAWS
        const ethersABeforeWithdraw = await accountA.getBalance();
        const ethersBBeforeWithdraw = await accountB.getBalance();
        const ethersDBeforeWithdraw = await accountD.getBalance();

        const txA = await ethPoolProxy.connect(accountA).withdraw();
        const receiptA = await txA.wait();
        const txB = await ethPoolProxy.connect(accountB).withdraw();
        const receiptB = await txB.wait();
        const txD = await ethPoolProxy.connect(accountD).withdraw();
        const receiptD = await txD.wait();

        // Final ETH balances should be the previous balance, plus the total withdrawal, minus network fees
        expect(await accountA.getBalance()).to.be.equal(
          ethersABeforeWithdraw
            .add(balanceA)
            .sub(receiptA.cumulativeGasUsed.mul(receiptA.effectiveGasPrice))
        );
        expect(await accountB.getBalance()).to.be.equal(
          ethersBBeforeWithdraw
            .add(balanceB)
            .sub(receiptB.cumulativeGasUsed.mul(receiptB.effectiveGasPrice))
        );
        expect(await accountD.getBalance()).to.be.equal(
          ethersDBeforeWithdraw
            .add(randomAmountD)
            .sub(receiptD.cumulativeGasUsed.mul(receiptD.effectiveGasPrice))
        );
      });

      it("Should update pool balance, user balance, active users array and activeUsersPosition when there is one unique active user", async function () {
        const {ethPoolProxy, accountC} = await loadFixture(ETHPoolFixture);

        const randomDeposit = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDeposit,
        });

        await ethPoolProxy.connect(accountC).withdraw();

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          ethers.constants.Zero
        );
        // User balance
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        await expect(ethPoolProxy.activeUsers(0)).to.be.revertedWithoutReason();
        // activeUsersPosition
        expect(
          await ethPoolProxy.activeUsersPosition(accountC.address)
        ).to.be.equal(ethers.constants.Zero);
      });
      it("Should update pool balance, user balance, active users array and activeUsersPosition when 1th active user withdraws", async function () {
        const {ethPoolProxy, accountD, accountB, accountC, accountA} =
          await loadFixture(ETHPoolFixture);

        const randomDepositA = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositC = UtilsTest.getRandomAmount();
        await accountA.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositA,
        });
        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositB,
        });
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositC,
        });

        const initialPoolBalance =
          randomDepositA + randomDepositB + randomDepositC;

        await ethPoolProxy.connect(accountA).withdraw();

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          initialPoolBalance - randomDepositA
        );
        // user balance
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          randomDepositB
        );
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          randomDepositC
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPoolProxy.activeUsers(0)).to.be.equal(accountC.address);
        expect(await ethPoolProxy.activeUsers(1)).to.be.equal(accountB.address);
        await expect(ethPoolProxy.activeUsers(2)).to.be.revertedWithoutReason();
        // activeUsersPosition
        expect(
          await ethPoolProxy.activeUsersPosition(accountA.address)
        ).to.be.equal(ethers.constants.Zero);
        expect(
          await ethPoolProxy.activeUsersPosition(accountB.address)
        ).to.be.equal(ethers.constants.Two);
        expect(
          await ethPoolProxy.activeUsersPosition(accountC.address)
        ).to.be.equal(ethers.constants.One);
        expect(
          await ethPoolProxy.activeUsersPosition(accountD.address)
        ).to.be.equal(ethers.constants.Zero);
      });
      it("Should update pool balance, user balance, active users array and activeUsersPosition when last active user withdraws", async function () {
        const {ethPoolProxy, accountD, accountB, accountC, accountA} =
          await loadFixture(ETHPoolFixture);

        const randomDepositA = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositC = UtilsTest.getRandomAmount();
        await accountA.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositA,
        });
        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositB,
        });
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositC,
        });

        const initialPoolBalance =
          randomDepositA + randomDepositB + randomDepositC;

        await ethPoolProxy.connect(accountC).withdraw();

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          initialPoolBalance - randomDepositC
        );
        // user balance
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          randomDepositA
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          randomDepositB
        );
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPoolProxy.activeUsers(0)).to.be.equal(accountA.address);
        expect(await ethPoolProxy.activeUsers(1)).to.be.equal(accountB.address);
        await expect(ethPoolProxy.activeUsers(2)).to.be.revertedWithoutReason();
        // activeUsersPosition
        expect(
          await ethPoolProxy.activeUsersPosition(accountA.address)
        ).to.be.equal(ethers.constants.One);
        expect(
          await ethPoolProxy.activeUsersPosition(accountB.address)
        ).to.be.equal(ethers.constants.Two);
        expect(
          await ethPoolProxy.activeUsersPosition(accountC.address)
        ).to.be.equal(ethers.constants.Zero);
        expect(
          await ethPoolProxy.activeUsersPosition(accountD.address)
        ).to.be.equal(ethers.constants.Zero);
      });
      it("Should update pool balance, user balance, active users array and activeUsersPosition when a middle active user withdraws", async function () {
        const {ethPoolProxy, accountD, accountB, accountC, accountA} =
          await loadFixture(ETHPoolFixture);

        const randomDepositA = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositC = UtilsTest.getRandomAmount();
        await accountA.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositA,
        });
        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositB,
        });
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositC,
        });

        const initialPoolBalance =
          randomDepositA + randomDepositB + randomDepositC;

        await ethPoolProxy.connect(accountB).withdraw();

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          initialPoolBalance - randomDepositB
        );
        // user balance
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          randomDepositA
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          randomDepositC
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPoolProxy.activeUsers(0)).to.be.equal(accountA.address);
        expect(await ethPoolProxy.activeUsers(1)).to.be.equal(accountC.address);
        await expect(ethPoolProxy.activeUsers(2)).to.be.revertedWithoutReason();
        // activeUsersPosition
        expect(
          await ethPoolProxy.activeUsersPosition(accountA.address)
        ).to.be.equal(ethers.constants.One);
        expect(
          await ethPoolProxy.activeUsersPosition(accountB.address)
        ).to.be.equal(ethers.constants.Zero);
        expect(
          await ethPoolProxy.activeUsersPosition(accountC.address)
        ).to.be.equal(ethers.constants.Two);
        expect(
          await ethPoolProxy.activeUsersPosition(accountD.address)
        ).to.be.equal(ethers.constants.Zero);
      });
    });
  });
});
