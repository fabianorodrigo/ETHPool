import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {deployETHPoolFixture} from "./shared/fixture";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Deployment", function () {
    it("Should set the DEFAULT_ADMIN_ROLE to publisher account, set MANAGER_ROLE to the specified manager, and set MANAGER_ROLE as TEAM_ROLE's admin", async function () {
      const {ethPool, owner, manager, teamMember, teamMemberB} =
        await loadFixture(ETHPoolFixture);

      const DEFAULT_ADMIN_ROLE = await ethPool.DEFAULT_ADMIN_ROLE();
      const MANAGER_ROLE = await ethPool.MANAGER_ROLE();
      const TEAM_ROLE = await ethPool.TEAM_ROLE();

      // the publisher account has DEFAULT_ADMIN_ROLE
      expect(await ethPool.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true;
      // the publisher account doesn't have MANAGER_ROLE neither TEAM_ROLE
      expect(await ethPool.hasRole(MANAGER_ROLE, owner.address)).to.be.false;
      expect(await ethPool.hasRole(TEAM_ROLE, owner.address)).to.be.false;
      // the manager has MANAGER_ROLE
      expect(await ethPool.hasRole(MANAGER_ROLE, manager.address)).to.be.true;
      // the manager account doesn't have DEFAULT_ADMIN_ROLE neither TEAM_ROLE
      expect(await ethPool.hasRole(DEFAULT_ADMIN_ROLE, manager.address)).to.be
        .false;
      expect(await ethPool.hasRole(TEAM_ROLE, manager.address)).to.be.false;
      // the team members account have TEAM_ROLE
      expect(await ethPool.hasRole(TEAM_ROLE, teamMember.address)).to.be.true;
      expect(await ethPool.hasRole(TEAM_ROLE, teamMemberB.address)).to.be.true;
      // the TEAM_ROLE's admin is the MANAGER_ROLE
      expect(await ethPool.getRoleAdmin(TEAM_ROLE)).to.be.eq(MANAGER_ROLE);
    });
  });
});
