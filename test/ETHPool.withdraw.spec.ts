import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {deployETHPoolFixture} from "./shared/fixture";
import {UtilsTest} from "./Utils";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Withdraw", function () {
    describe("Validations", function () {
      it("Should revert if some user without balance tries to withdraw when there isn't any active user", async function () {
        const {ethPool, accountA} = await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(accountA).withdraw()
        ).to.be.revertedWithCustomError(ethPool, "ZeroBalance");
      });
      it("Should revert if some user without balance tries to withdraw", async function () {
        const {ethPool, accountA, accountD} = await loadFixture(ETHPoolFixture);

        const randomAmount = UtilsTest.getRandomAmount();
        await accountD.sendTransaction({
          to: ethPool.address,
          value: randomAmount,
        });

        await expect(
          ethPool.connect(accountA).withdraw()
        ).to.be.revertedWithCustomError(ethPool, "ZeroBalance");
      });
    });
    describe("Events", function () {
      it("Should emit an event on Withdrawal", async function () {
        const {ethPool, accountD} = await loadFixture(ETHPoolFixture);

        const randomAmount = UtilsTest.getRandomAmount();
        const receipt = await accountD.sendTransaction({
          to: ethPool.address,
          value: randomAmount,
        });
        //await receipt.wait();

        await expect(ethPool.connect(accountD).withdraw())
          .to.emit(ethPool, "Withdrawal")
          .withArgs(accountD.address, randomAmount);
      });
    });
    describe("State", function () {
      it("Should update pool balance, user balance, active users array and activeUsersPosition when there is one unique active user", async function () {
        const {ethPool, accountC} = await loadFixture(ETHPoolFixture);

        const randomDeposit = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDeposit,
        });

        await ethPool.connect(accountC).withdraw();

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(ethers.constants.Zero);
        // User balance
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        await expect(ethPool.activeUsers(0)).to.be.revertedWithoutReason;
        // activeUsersPosition
        expect(await ethPool.activeUsersPosition(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
      });
      it("Should update pool balance, user balance, active users array and activeUsersPosition when 1th active user withdraws", async function () {
        const {ethPool, accountD, accountB, accountC, accountA} =
          await loadFixture(ETHPoolFixture);

        const randomDepositA = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositC = UtilsTest.getRandomAmount();
        await accountA.sendTransaction({
          to: ethPool.address,
          value: randomDepositA,
        });
        await accountB.sendTransaction({
          to: ethPool.address,
          value: randomDepositB,
        });
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDepositC,
        });

        const initialPoolBalance =
          randomDepositA + randomDepositB + randomDepositC;

        await ethPool.connect(accountA).withdraw();

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          initialPoolBalance - randomDepositA
        );
        // user balance
        expect(await ethPool.balances(accountA.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          randomDepositB
        );
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          randomDepositC
        );
        expect(await ethPool.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPool.activeUsers(0)).to.be.equal(accountC.address);
        expect(await ethPool.activeUsers(1)).to.be.equal(accountB.address);
        await expect(ethPool.activeUsers(2)).to.be.revertedWithoutReason;
        // activeUsersPosition
        expect(await ethPool.activeUsersPosition(accountA.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.activeUsersPosition(accountB.address)).to.be.equal(
          ethers.constants.Two
        );
        expect(await ethPool.activeUsersPosition(accountC.address)).to.be.equal(
          ethers.constants.One
        );
        expect(await ethPool.activeUsersPosition(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
      });
      it("Should update pool balance, user balance, active users array and activeUsersPosition when last active user withdraws", async function () {
        const {ethPool, accountD, accountB, accountC, accountA} =
          await loadFixture(ETHPoolFixture);

        const randomDepositA = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositC = UtilsTest.getRandomAmount();
        await accountA.sendTransaction({
          to: ethPool.address,
          value: randomDepositA,
        });
        await accountB.sendTransaction({
          to: ethPool.address,
          value: randomDepositB,
        });
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDepositC,
        });

        const initialPoolBalance =
          randomDepositA + randomDepositB + randomDepositC;

        await ethPool.connect(accountC).withdraw();

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          initialPoolBalance - randomDepositC
        );
        // user balance
        expect(await ethPool.balances(accountA.address)).to.be.equal(
          randomDepositA
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          randomDepositB
        );
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPool.activeUsers(0)).to.be.equal(accountA.address);
        expect(await ethPool.activeUsers(1)).to.be.equal(accountB.address);
        await expect(ethPool.activeUsers(2)).to.be.revertedWithoutReason;
        // activeUsersPosition
        expect(await ethPool.activeUsersPosition(accountA.address)).to.be.equal(
          ethers.constants.One
        );
        expect(await ethPool.activeUsersPosition(accountB.address)).to.be.equal(
          ethers.constants.Two
        );
        expect(await ethPool.activeUsersPosition(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.activeUsersPosition(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
      });
      it("Should update pool balance, user balance, active users array and activeUsersPosition when a middle active user withdraws", async function () {
        const {ethPool, accountD, accountB, accountC, accountA} =
          await loadFixture(ETHPoolFixture);

        const randomDepositA = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositC = UtilsTest.getRandomAmount();
        await accountA.sendTransaction({
          to: ethPool.address,
          value: randomDepositA,
        });
        await accountB.sendTransaction({
          to: ethPool.address,
          value: randomDepositB,
        });
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDepositC,
        });

        const initialPoolBalance =
          randomDepositA + randomDepositB + randomDepositC;

        await ethPool.connect(accountB).withdraw();

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          initialPoolBalance - randomDepositB
        );
        // user balance
        expect(await ethPool.balances(accountA.address)).to.be.equal(
          randomDepositA
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          randomDepositC
        );
        expect(await ethPool.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPool.activeUsers(0)).to.be.equal(accountA.address);
        expect(await ethPool.activeUsers(1)).to.be.equal(accountC.address);
        await expect(ethPool.activeUsers(2)).to.be.revertedWithoutReason;
        // activeUsersPosition
        expect(await ethPool.activeUsersPosition(accountA.address)).to.be.equal(
          ethers.constants.One
        );
        expect(await ethPool.activeUsersPosition(accountB.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.activeUsersPosition(accountC.address)).to.be.equal(
          ethers.constants.Two
        );
        expect(await ethPool.activeUsersPosition(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
      });
    });
  });
});
