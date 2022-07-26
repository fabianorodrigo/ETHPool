import {ETHPoolUpgradeable__factory} from "./../typechain-types/factories/contracts/ETHPoolUpgradeable__factory";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers, network} from "hardhat";
import {deployETHPoolUpgradeableFixture} from "./shared/fixtureUpgradeable";
import {UtilsTest} from "./Utils";
import {ETHPoolUpgradeable} from "../typechain-types";
import {getImplementationAddress} from "@openzeppelin/upgrades-core";

describe("ETHPoolUpgradeable", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolUpgradeableFixture;

  describe("Deposits", function () {
    describe("Validations", function () {
      it("Should revert if deposit 0 ETH", async function () {
        const {ethPoolProxy, accountA} = await loadFixture(ETHPoolFixture);

        await expect(
          accountA.sendTransaction({
            to: ethPoolProxy.address,
            value: ethers.constants.Zero,
          })
        ).to.be.revertedWithCustomError(ethPoolProxy, "InvalidAmount");
      });

      it(`Should revert if try to deposit direct to the implementation contract is spite of the proxy contract`, async function () {
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

        await expect(
          accountA.sendTransaction({
            to: implementationAddress,
            value: ethers.constants.Zero,
          })
        ).to.be.revertedWith("Function must be called through delegatecall");
      });
    });
    describe("Events", function () {
      it("Should emit an event on Deposit", async function () {
        const {ethPoolProxy, accountD} = await loadFixture(ETHPoolFixture);

        const randomAmount = UtilsTest.getRandomAmount();
        await expect(
          accountD.sendTransaction({
            to: ethPoolProxy.address,
            value: randomAmount,
          })
        )
          .to.emit(ethPoolProxy, "Deposit")
          .withArgs(accountD.address, randomAmount);
      });
    });
    describe("State", function () {
      it("Should update pool balance, user balance, active users array and activeUsers position in active users array ", async function () {
        const {ethPoolProxy, accountA, accountB, accountC, accountD} =
          await loadFixture(ETHPoolFixture);

        ///// FIRST DEPOSITS FROM accountB AND accountA
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
        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          randomAmountA + randomAmountB
        );
        // user balance
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          randomAmountA
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          randomAmountB
        );
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          ethers.constants.Zero
        );
        // Active users array
        expect(await ethPoolProxy.activeUsers(0)).to.be.equal(accountB.address);
        expect(await ethPoolProxy.activeUsers(1)).to.be.equal(accountA.address);
        await expect(ethPoolProxy.activeUsers(2)).to.be.revertedWithoutReason();
        // activeUsersPosition
        expect(
          await ethPoolProxy.activeUsersPosition(accountB.address)
        ).to.be.equal(ethers.constants.One);
        expect(
          await ethPoolProxy.activeUsersPosition(accountA.address)
        ).to.be.equal(ethers.constants.Two);
        expect(
          await ethPoolProxy.activeUsersPosition(accountC.address)
        ).to.be.equal(ethers.constants.Zero);
        expect(
          await ethPoolProxy.activeUsersPosition(accountD.address)
        ).to.be.equal(ethers.constants.Zero);

        ///// SECOND DEPOSIT FROM accountB AND FIRST from accountD
        const random2ndAmountB = UtilsTest.getRandomAmount();
        const randomAmountD = UtilsTest.getRandomAmount();

        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: random2ndAmountB,
        });
        await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: randomAmountD,
        });
        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          randomAmountA + randomAmountB + random2ndAmountB + randomAmountD
        );
        // user balance
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          randomAmountA
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          randomAmountB + random2ndAmountB
        );
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          ethers.constants.Zero
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          randomAmountD
        );
        // Active users array
        expect(await ethPoolProxy.activeUsers(0)).to.be.equal(accountB.address);
        expect(await ethPoolProxy.activeUsers(1)).to.be.equal(accountA.address);
        expect(await ethPoolProxy.activeUsers(2)).to.be.equal(accountD.address);
        await expect(ethPoolProxy.activeUsers(3)).to.be.revertedWithoutReason();
        // activeUsersPosition
        expect(
          await ethPoolProxy.activeUsersPosition(accountB.address)
        ).to.be.equal(ethers.constants.One);
        expect(
          await ethPoolProxy.activeUsersPosition(accountA.address)
        ).to.be.equal(ethers.constants.Two);
        expect(
          await ethPoolProxy.activeUsersPosition(accountD.address)
        ).to.be.equal(3);
        expect(
          await ethPoolProxy.activeUsersPosition(accountC.address)
        ).to.be.equal(ethers.constants.Zero);
      });
    });
  });
});
