import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {deployETHPoolFixture} from "./shared/fixture";
import {UtilsTest} from "./Utils";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Deposits", function () {
    describe("Validations", function () {
      it("Should revert if deposit 0 ETH", async function () {
        const {ethPool, accountA} = await loadFixture(ETHPoolFixture);

        await expect(
          accountA.sendTransaction({
            to: ethPool.address,
            value: ethers.constants.Zero,
          })
        ).to.be.revertedWithCustomError(ethPool, "InvalidAmount");
      });
    });
    describe("Events", function () {
      it("Should emit an event on Deposit", async function () {
        const {ethPool, accountD} = await loadFixture(ETHPoolFixture);

        const randomAmount = UtilsTest.getRandomAmount();
        await expect(
          accountD.sendTransaction({
            to: ethPool.address,
            value: randomAmount,
          })
        )
          .to.emit(ethPool, "Deposit")
          .withArgs(accountD.address, randomAmount);
      });
    });
    describe("State", function () {
      it("Should update pool balance, user balance, active users array and activeUsers position in active users array ", async function () {
        const {ethPool, accountA, accountB, accountC, accountD} =
          await loadFixture(ETHPoolFixture);

        ///// FIRST DEPOSITS FROM accountB AND accountA
        const randomAmountA = UtilsTest.getRandomAmount();
        const randomAmountB = UtilsTest.getRandomAmount();

        await accountB.sendTransaction({
          to: ethPool.address,
          value: randomAmountB,
        });
        await accountA.sendTransaction({
          to: ethPool.address,
          value: randomAmountA,
        });
        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          randomAmountA + randomAmountB
        );
        // user balance
        expect(await ethPool.balances(accountA.address)).to.be.equal(
          randomAmountA
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          randomAmountB
        );
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPool.activeUsers(0)).to.be.equal(accountB.address);
        expect(await ethPool.activeUsers(1)).to.be.equal(accountA.address);
        await expect(ethPool.activeUsers(2)).to.be.revertedWithoutReason;
        // activeUsersPosition
        expect(await ethPool.activeUsersPosition(accountB.address)).to.be.equal(
          ethers.constants.One
        );
        expect(await ethPool.activeUsersPosition(accountA.address)).to.be.equal(
          ethers.constants.Two
        );
        expect(await ethPool.activeUsersPosition(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.activeUsersPosition(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );

        ///// SECOND DEPOSIT FROM accountB AND FIRST from accountD
        const random2ndAmountB = UtilsTest.getRandomAmount();
        const randomAmountD = UtilsTest.getRandomAmount();

        await accountB.sendTransaction({
          to: ethPool.address,
          value: random2ndAmountB,
        });
        await accountD.sendTransaction({
          to: ethPool.address,
          value: randomAmountD,
        });
        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          randomAmountA + randomAmountB + random2ndAmountB + randomAmountD
        );
        // user balance
        expect(await ethPool.balances(accountA.address)).to.be.equal(
          randomAmountA
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          randomAmountB + random2ndAmountB
        );
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.balances(accountD.address)).to.be.equal(
          randomAmountD
        );
        // Active users array
        expect(await ethPool.activeUsers(0)).to.be.equal(accountB.address);
        expect(await ethPool.activeUsers(1)).to.be.equal(accountA.address);
        expect(await ethPool.activeUsers(2)).to.be.equal(accountD.address);
        await expect(ethPool.activeUsers(3)).to.be.revertedWithoutReason;
        // activeUsersPosition
        expect(await ethPool.activeUsersPosition(accountB.address)).to.be.equal(
          ethers.constants.One
        );
        expect(await ethPool.activeUsersPosition(accountA.address)).to.be.equal(
          ethers.constants.Two
        );
        expect(await ethPool.activeUsersPosition(accountD.address)).to.be.equal(
          3
        );
        expect(await ethPool.activeUsersPosition(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
      });
    });
  });
});
