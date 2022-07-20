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
      it("Should update pool balance, user balance, active users array and activeUser index in active users array ", async function () {
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
        // activeUsersIndex
        expect(await ethPool.activeUsersIndex(accountB.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.activeUsersIndex(accountA.address)).to.be.equal(
          ethers.constants.One
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
        // activeUsersIndex
        expect(await ethPool.activeUsersIndex(accountB.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPool.activeUsersIndex(accountA.address)).to.be.equal(
          ethers.constants.One
        );
        expect(await ethPool.activeUsersIndex(accountD.address)).to.be.equal(
          ethers.constants.Two
        );
      });
    });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const {ethPool} = await loadFixture(ETHPoolFixture);

  //       // await expect(ethPool.withdraw()).to.be.revertedWith(
  //       //   "You can't withdraw yet"
  //       // );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const {ethPool, unlockTime, otherAccount} = await loadFixture(
  //         ETHPoolFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(
  //         ethPool.connect(otherAccount).withdraw()
  //       ).to.be.revertedWith("You aren't the owner");
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const {ethPool, unlockTime} = await loadFixture(ETHPoolFixture);

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(ethPool.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const {ethPool, unlockTime, lockedAmount} = await loadFixture(
  //         ETHPoolFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(ethPool.withdraw())
  //         .to.emit(ethPool, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const {ethPool, unlockTime, lockedAmount, owner} = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(ethPool.withdraw()).to.changeEtherBalances(
  //         [owner, ethPool],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
