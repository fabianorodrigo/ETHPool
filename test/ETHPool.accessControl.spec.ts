import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {deployETHPoolFixture} from "./shared/fixture";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Access Control", function () {
    describe("Validations", function () {
      it("Should revert if the admin account try to grant TEAM role", async function () {
        const {ethPool, owner, accountE, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(owner).grantRole(TEAM_ROLE, accountE.address)
        ).to.be.revertedWith(
          `AccessControl: account ${owner.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if the admin account try to revoke TEAM role", async function () {
        const {ethPool, owner, teamMember, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(owner).revokeRole(TEAM_ROLE, teamMember.address)
        ).to.be.revertedWith(
          `AccessControl: account ${owner.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if the team member account try to grant TEAM role", async function () {
        const {ethPool, teamMember, accountE, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(teamMember).grantRole(TEAM_ROLE, accountE.address)
        ).to.be.revertedWith(
          `AccessControl: account ${teamMember.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if the team member account try to revoke TEAM role", async function () {
        const {ethPool, teamMember, teamMemberB, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(teamMemberB).revokeRole(TEAM_ROLE, teamMember.address)
        ).to.be.revertedWith(
          `AccessControl: account ${teamMemberB.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if a manager account try to grant MANAGER role", async function () {
        const {ethPool, manager, accountE, MANAGER_ROLE, DEFAULT_ADMIN_ROLE} =
          await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(manager).grantRole(MANAGER_ROLE, accountE.address)
        ).to.be.revertedWith(
          `AccessControl: account ${manager.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
        );
      });
    });
    describe("Grants & Revokes", function () {
      it("Should a manager account grant TEAM role", async function () {
        const {ethPool, manager, accountE, TEAM_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool.connect(manager).grantRole(TEAM_ROLE, accountE.address)
        )
          .to.emit(ethPool, "RoleGranted")
          .withArgs(TEAM_ROLE, accountE.address, manager.address);
        expect(await ethPool.hasRole(TEAM_ROLE, accountE.address)).to.be.true;
      });
      it("Should a manager account revoke TEAM role", async function () {
        const {ethPool, manager, teamMember, TEAM_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool.connect(manager).revokeRole(TEAM_ROLE, teamMember.address)
        )
          .to.emit(ethPool, "RoleRevoked")
          .withArgs(TEAM_ROLE, teamMember.address, manager.address);
        expect(await ethPool.hasRole(TEAM_ROLE, teamMember.address)).to.be
          .false;
      });
      it("Should admin account grant MANAGER role", async function () {
        const {ethPool, owner, manager, teamMember, MANAGER_ROLE} =
          await loadFixture(ETHPoolFixture);

        await expect(
          ethPool.connect(owner).grantRole(MANAGER_ROLE, teamMember.address)
        )
          .to.emit(ethPool, "RoleGranted")
          .withArgs(MANAGER_ROLE, teamMember.address, owner.address);
        expect(await ethPool.hasRole(MANAGER_ROLE, teamMember.address)).to.be
          .true;
      });
      it("Should admin account revoke MANAGER role", async function () {
        const {ethPool, owner, manager, MANAGER_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool.connect(owner).revokeRole(MANAGER_ROLE, manager.address)
        )
          .to.emit(ethPool, "RoleRevoked")
          .withArgs(MANAGER_ROLE, manager.address, owner.address);
        expect(await ethPool.hasRole(MANAGER_ROLE, manager.address)).to.be
          .false;
      });
      it("Should a admin account renounce DEFAULT_ADMIN role", async function () {
        const {ethPool, owner, DEFAULT_ADMIN_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool.connect(owner).renounceRole(DEFAULT_ADMIN_ROLE, owner.address)
        )
          .to.emit(ethPool, "RoleRevoked")
          .withArgs(DEFAULT_ADMIN_ROLE, owner.address, owner.address);
        expect(await ethPool.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
          .false;
      });

      it("Should a manager account renounce MANAGER role", async function () {
        const {ethPool, manager, accountE, MANAGER_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool.connect(manager).renounceRole(MANAGER_ROLE, manager.address)
        )
          .to.emit(ethPool, "RoleRevoked")
          .withArgs(MANAGER_ROLE, manager.address, manager.address);
        expect(await ethPool.hasRole(MANAGER_ROLE, manager.address)).to.be
          .false;
      });

      it("Should a team member account renounce TEAM role", async function () {
        const {ethPool, teamMember, TEAM_ROLE} = await loadFixture(
          ETHPoolFixture
        );

        await expect(
          ethPool
            .connect(teamMember)
            .renounceRole(TEAM_ROLE, teamMember.address)
        )
          .to.emit(ethPool, "RoleRevoked")
          .withArgs(TEAM_ROLE, teamMember.address, teamMember.address);
        expect(await ethPool.hasRole(TEAM_ROLE, teamMember.address)).to.be
          .false;
      });
    });
  });
});
