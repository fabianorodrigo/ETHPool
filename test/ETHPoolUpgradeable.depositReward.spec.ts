import {getImplementationAddress} from "@openzeppelin/upgrades-core";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers, network} from "hardhat";
import {deployETHPoolUpgradeableFixture} from "./shared/fixtureUpgradeable";
import {UtilsTest} from "./Utils";
import {
  ETHPoolUpgradeable,
  ETHPoolUpgradeable__factory,
} from "../typechain-types";

describe("ETHPoolUpgradeable", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolUpgradeableFixture;

  describe("Rewards", function () {
    describe("Validations", function () {
      it("Should revert if reward is 0 ETH", async function () {
        const {ethPoolProxy, teamMember} = await loadFixture(ETHPoolFixture);

        await expect(
          ethPoolProxy.connect(teamMember).depositReward({
            value: ethers.constants.Zero,
          })
        ).to.be.revertedWithCustomError(ethPoolProxy, "InvalidAmount");
      });
      it("Should revert if there is no active users in the pool", async function () {
        const {ethPoolProxy, teamMember} = await loadFixture(ETHPoolFixture);
        const randomAmount = UtilsTest.getRandomAmount();
        await expect(
          ethPoolProxy.connect(teamMember).depositReward({
            value: randomAmount,
          })
        ).to.be.revertedWithCustomError(ethPoolProxy, "NoActiveUsers");
      });
      it("Should revert if some account without team role try to send reward", async function () {
        const {ethPoolProxy, accountA, TEAM_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPoolProxy.connect(accountA).depositReward({
            value: ethers.constants.One,
          })
        ).to.be.revertedWith(
          `AccessControl: account ${accountA.address.toLowerCase()} is missing role ${TEAM_ROLE}`
        );
      });
      it(`Should revert if try to deposit reward direct to the implementation contract is spite of the proxy contract`, async function () {
        const {ethPoolProxy, teamMember} = await loadFixture(ETHPoolFixture);
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
          ethPool.connect(teamMember).depositReward({
            value: ethers.constants.One,
          })
        ).to.be.revertedWith("Function must be called through delegatecall");
      });
    });
    describe("Events", function () {
      it("Should emit an event on RewardDeposit", async function () {
        const {ethPoolProxy, teamMember, accountD} = await loadFixture(
          ETHPoolFixture
        );

        await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: ethers.constants.Two,
        });

        const randomAmount = UtilsTest.getRandomAmount();
        await expect(
          ethPoolProxy.connect(teamMember).depositReward({
            value: randomAmount,
          })
        )
          .to.emit(ethPoolProxy, "RewardDeposit")
          .withArgs(randomAmount);
      });
    });
    describe("State", function () {
      it("Should update pool balance and user balance with all reward when there is one unique active user ", async function () {
        const {ethPoolProxy, teamMember, accountC} = await loadFixture(
          ETHPoolFixture
        );

        const randomDeposit = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDeposit,
        });

        const randomReward = UtilsTest.getRandomAmount();
        await ethPoolProxy.connect(teamMember).depositReward({
          value: randomReward,
        });

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          randomDeposit + randomReward
        );
        // User balance
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          randomDeposit + randomReward
        );
      });
      it("Should update pool balance and users balance with equal rewards when all active users have deposited the same amount", async function () {
        const {ethPoolProxy, teamMember, accountA, accountB, accountC} =
          await loadFixture(ETHPoolFixture);

        const randomDeposit = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDeposit,
        });
        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDeposit,
        });
        await accountA.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDeposit,
        });

        const randomReward = UtilsTest.getRandomAmount();
        await ethPoolProxy.connect(teamMember).depositReward({
          value: randomReward,
        });

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          randomDeposit * 3 + randomReward
        );
        // User balance (Division always truncates, it just maps to the DIV opcode of the EVM)
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          randomDeposit + Math.floor(randomReward / 3)
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          randomDeposit + Math.floor(randomReward / 3)
        );
        expect(await ethPoolProxy.balances(accountA.address)).to.be.equal(
          randomDeposit + Math.floor(randomReward / 3)
        );
      });
      it("Should update pool balance and users balance with proportional rewards when active users have deposited different amounts", async function () {
        const {ethPoolProxy, teamMember, accountD, accountB, accountC} =
          await loadFixture(ETHPoolFixture);

        const randomDepositC = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositD = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositC,
        });
        await accountB.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositB,
        });
        await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: randomDepositD,
        });

        const randomReward = UtilsTest.getRandomAmount();
        await ethPoolProxy.connect(teamMember).depositReward({
          value: randomReward,
        });

        const initialPoolBalance =
          randomDepositB + randomDepositC + randomDepositD;

        // Pool balance
        expect(await ethPoolProxy.poolBalance()).to.be.equal(
          initialPoolBalance + randomReward
        );
        // User balance (Division always truncates, it just maps to the DIV opcode of the EVM)
        expect(await ethPoolProxy.balances(accountC.address)).to.be.equal(
          randomDepositC +
            Math.floor((randomReward * randomDepositC) / initialPoolBalance)
        );
        expect(await ethPoolProxy.balances(accountB.address)).to.be.equal(
          randomDepositB +
            Math.floor((randomReward * randomDepositB) / initialPoolBalance)
        );
        expect(await ethPoolProxy.balances(accountD.address)).to.be.equal(
          randomDepositD +
            Math.floor((randomReward * randomDepositD) / initialPoolBalance)
        );
      });
      it("Should allow any account to send reward after associate it with the TEAM role", async function () {
        const {ethPoolProxy, accountA, accountD, manager, TEAM_ROLE} =
          await loadFixture(ETHPoolFixture);

        await ethPoolProxy
          .connect(manager)
          .grantRole(TEAM_ROLE, accountA.address);

        await accountD.sendTransaction({
          to: ethPoolProxy.address,
          value: ethers.constants.Two,
        });

        const randomAmount = UtilsTest.getRandomAmount();
        await ethPoolProxy.connect(accountA).depositReward({
          value: randomAmount,
        });
      });
    });
  });
});
