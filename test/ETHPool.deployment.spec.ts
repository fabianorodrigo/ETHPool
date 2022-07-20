import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {deployETHPoolFixture} from "./shared/fixture";
import {UtilsTest} from "./Utils";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Deployment", function () {
    it("Should set the default admin role to publisher account, and the team role admin to the specified manager", async function () {
      const {ethPool, owner, manager, teamMember, teamMemberB} =
        await loadFixture(ETHPoolFixture);

      const DEFAULT_ADMIN_ROLE = await ethPool.DEFAULT_ADMIN_ROLE();
      const TEAM_ROLE = await ethPool.TEAM_ROLE();
      const TEAM_ADMIN_ROLE = await ethPool.getRoleAdmin(TEAM_ROLE);

      expect(await ethPool.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true;
      expect(await ethPool.hasRole(TEAM_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await ethPool.hasRole(TEAM_ADMIN_ROLE, manager.address)).to.be
        .true;
      expect(await ethPool.hasRole(TEAM_ROLE, teamMember.address)).to.be.true;
      expect(await ethPool.hasRole(TEAM_ROLE, teamMemberB.address)).to.be.true;
    });

    // it("Should receive and store the funds to lock", async function () {
    //   const {ethPool, lockedAmount} = await loadFixture(ETHPoolFixture);

    //   // expect(await ethers.provider.getBalance(lock.address)).to.equal(
    //   //   lockedAmount
    //   // );
    // });
  });
});
