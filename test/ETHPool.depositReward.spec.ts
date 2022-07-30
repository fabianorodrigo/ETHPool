import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {deployETHPoolFixture} from "./shared/fixture";
import {UtilsTest} from "./Utils";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Rewards", function () {
    describe("Validations", function () {
      it("Should revert if reward is 0 ETH", async function () {
        const {ethPool, teamMember} = await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(teamMember).depositReward({
            value: ethers.constants.Zero,
          })
        ).to.be.revertedWithCustomError(ethPool, "InvalidAmount");
      });
      it("Should revert if there is no active users in the pool", async function () {
        const {ethPool, teamMember} = await loadFixture(ETHPoolFixture);
        const randomAmount = UtilsTest.getRandomAmount();
        await expect(
          ethPool.connect(teamMember).depositReward({
            value: randomAmount,
          })
        ).to.be.revertedWithCustomError(ethPool, "NoActiveUsers");
      });
      it("Should revert if the admin account try to send reward", async function () {
        const {ethPool, owner, TEAM_ROLE} = await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(owner).depositReward({
            value: ethers.constants.One,
          })
        ).to.be.revertedWith(
          `AccessControl: account ${owner.address.toLowerCase()} is missing role ${TEAM_ROLE}`
        );
      });
      it("Should revert if a manager account try to send reward", async function () {
        const {ethPool, manager, TEAM_ROLE} = await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(manager).depositReward({
            value: ethers.constants.One,
          })
        ).to.be.revertedWith(
          `AccessControl: account ${manager.address.toLowerCase()} is missing role ${TEAM_ROLE}`
        );
      });
      it("Should revert if some account without team role try to send reward", async function () {
        const {ethPool, accountA, TEAM_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool.connect(accountA).depositReward({
            value: ethers.constants.One,
          })
        ).to.be.revertedWith(
          `AccessControl: account ${accountA.address.toLowerCase()} is missing role ${TEAM_ROLE}`
        );
      });
    });
    describe("Events", function () {
      it("Should emit an event on RewardDeposit", async function () {
        const {ethPool, teamMember, accountD} = await loadFixture(
          ETHPoolFixture
        );

        await accountD.sendTransaction({
          to: ethPool.address,
          value: ethers.constants.Two,
        });

        const randomAmount = UtilsTest.getRandomAmount();
        await expect(
          ethPool.connect(teamMember).depositReward({
            value: randomAmount,
          })
        )
          .to.emit(ethPool, "RewardDeposit")
          .withArgs(randomAmount);
      });
    });
    describe("State", function () {
      it("Should update pool balance and user balance with all reward when there is one unique active user ", async function () {
        const {ethPool, teamMember, accountC} = await loadFixture(
          ETHPoolFixture
        );

        const randomDeposit = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDeposit,
        });

        const randomReward = UtilsTest.getRandomAmount();
        await ethPool.connect(teamMember).depositReward({
          value: randomReward,
        });

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          randomDeposit + randomReward
        );
        // User balance
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          randomDeposit + randomReward
        );
      });
      it("Should update pool balance and users balance with equal rewards when all active users have deposited the same amount", async function () {
        const {ethPool, teamMember, accountA, accountB, accountC} =
          await loadFixture(ETHPoolFixture);

        const randomDeposit = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDeposit,
        });
        await accountB.sendTransaction({
          to: ethPool.address,
          value: randomDeposit,
        });
        await accountA.sendTransaction({
          to: ethPool.address,
          value: randomDeposit,
        });

        const randomReward = UtilsTest.getRandomAmount();
        await ethPool.connect(teamMember).depositReward({
          value: randomReward,
        });

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          randomDeposit * 3 + randomReward
        );
        // User balance (Division always truncates, it just maps to the DIV opcode of the EVM)
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          randomDeposit + Math.floor(randomReward / 3)
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          randomDeposit + Math.floor(randomReward / 3)
        );
        expect(await ethPool.balances(accountA.address)).to.be.equal(
          randomDeposit + Math.floor(randomReward / 3)
        );
      });
      it("Should update pool balance and users balance with proportional rewards when active users have deposited different amounts", async function () {
        const {ethPool, teamMember, accountD, accountB, accountC} =
          await loadFixture(ETHPoolFixture);

        const randomDepositC = UtilsTest.getRandomAmount();
        const randomDepositB = UtilsTest.getRandomAmount();
        const randomDepositD = UtilsTest.getRandomAmount();
        await accountC.sendTransaction({
          to: ethPool.address,
          value: randomDepositC,
        });
        await accountB.sendTransaction({
          to: ethPool.address,
          value: randomDepositB,
        });
        await accountD.sendTransaction({
          to: ethPool.address,
          value: randomDepositD,
        });

        const randomReward = UtilsTest.getRandomAmount();
        await ethPool.connect(teamMember).depositReward({
          value: randomReward,
        });

        const initialPoolBalance =
          randomDepositB + randomDepositC + randomDepositD;

        // Pool balance
        expect(await ethPool.poolBalance()).to.be.equal(
          initialPoolBalance + randomReward
        );
        // User balance (Division always truncates, it just maps to the DIV opcode of the EVM)
        expect(await ethPool.balances(accountC.address)).to.be.equal(
          randomDepositC +
            Math.floor((randomReward * randomDepositC) / initialPoolBalance)
        );
        expect(await ethPool.balances(accountB.address)).to.be.equal(
          randomDepositB +
            Math.floor((randomReward * randomDepositB) / initialPoolBalance)
        );
        expect(await ethPool.balances(accountD.address)).to.be.equal(
          randomDepositD +
            Math.floor((randomReward * randomDepositD) / initialPoolBalance)
        );
      });
      it("Should allow any account to send reward after associate it with the TEAM role", async function () {
        const {ethPool, accountA, accountD, manager, TEAM_ROLE} =
          await loadFixture(ETHPoolFixture);

        await ethPool.connect(manager).grantRole(TEAM_ROLE, accountA.address);

        await accountD.sendTransaction({
          to: ethPool.address,
          value: ethers.constants.Two,
        });

        const randomAmount = UtilsTest.getRandomAmount();
        await ethPool.connect(accountA).depositReward({
          value: randomAmount,
        });
      });
    });
  });
});
