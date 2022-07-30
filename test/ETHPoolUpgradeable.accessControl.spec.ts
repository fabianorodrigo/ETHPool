import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {deployETHPoolUpgradeableFixture} from "./shared/fixtureUpgradeable";

describe("ethPoolProxy", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ethPoolProxyFixture = deployETHPoolUpgradeableFixture;

  describe("Access Control", function () {
    describe("Validations", function () {
      it("Should revert if the admin account try to grant TEAM role", async function () {
        const {ethPoolProxy, owner, accountE, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy.connect(owner).grantRole(TEAM_ROLE, accountE.address)
        ).to.be.revertedWith(
          `AccessControl: account ${owner.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if the admin account try to revoke TEAM role", async function () {
        const {ethPoolProxy, owner, teamMember, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy.connect(owner).revokeRole(TEAM_ROLE, teamMember.address)
        ).to.be.revertedWith(
          `AccessControl: account ${owner.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if the team member account try to grant TEAM role", async function () {
        const {ethPoolProxy, teamMember, accountE, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy
            .connect(teamMember)
            .grantRole(TEAM_ROLE, accountE.address)
        ).to.be.revertedWith(
          `AccessControl: account ${teamMember.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if the team member account try to revoke TEAM role", async function () {
        const {ethPoolProxy, teamMember, teamMemberB, TEAM_ROLE, MANAGER_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy
            .connect(teamMemberB)
            .revokeRole(TEAM_ROLE, teamMember.address)
        ).to.be.revertedWith(
          `AccessControl: account ${teamMemberB.address.toLowerCase()} is missing role ${MANAGER_ROLE}`
        );
      });
      it("Should revert if a manager account try to grant MANAGER role", async function () {
        const {
          ethPoolProxy,
          manager,
          accountE,
          MANAGER_ROLE,
          DEFAULT_ADMIN_ROLE,
        } = await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy
            .connect(manager)
            .grantRole(MANAGER_ROLE, accountE.address)
        ).to.be.revertedWith(
          `AccessControl: account ${manager.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
        );
      });
    });
    describe("Grants & Revokes", function () {
      it("Should a manager account grant TEAM role", async function () {
        const {ethPoolProxy, manager, accountE, TEAM_ROLE} = await loadFixture(
          ethPoolProxyFixture
        );

        await expect(
          ethPoolProxy.connect(manager).grantRole(TEAM_ROLE, accountE.address)
        )
          .to.emit(ethPoolProxy, "RoleGranted")
          .withArgs(TEAM_ROLE, accountE.address, manager.address);
        expect(await ethPoolProxy.hasRole(TEAM_ROLE, accountE.address)).to.be
          .true;
      });
      it("Should a manager account revoke TEAM role", async function () {
        const {ethPoolProxy, manager, teamMember, TEAM_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy
            .connect(manager)
            .revokeRole(TEAM_ROLE, teamMember.address)
        )
          .to.emit(ethPoolProxy, "RoleRevoked")
          .withArgs(TEAM_ROLE, teamMember.address, manager.address);
        expect(await ethPoolProxy.hasRole(TEAM_ROLE, teamMember.address)).to.be
          .false;
      });
      it("Should admin account grant MANAGER role", async function () {
        const {ethPoolProxy, owner, manager, teamMember, MANAGER_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy
            .connect(owner)
            .grantRole(MANAGER_ROLE, teamMember.address)
        )
          .to.emit(ethPoolProxy, "RoleGranted")
          .withArgs(MANAGER_ROLE, teamMember.address, owner.address);
        expect(await ethPoolProxy.hasRole(MANAGER_ROLE, teamMember.address)).to
          .be.true;
      });
      it("Should admin account revoke MANAGER role", async function () {
        const {ethPoolProxy, owner, manager, MANAGER_ROLE} = await loadFixture(
          ethPoolProxyFixture
        );

        await expect(
          ethPoolProxy.connect(owner).revokeRole(MANAGER_ROLE, manager.address)
        )
          .to.emit(ethPoolProxy, "RoleRevoked")
          .withArgs(MANAGER_ROLE, manager.address, owner.address);
        expect(await ethPoolProxy.hasRole(MANAGER_ROLE, manager.address)).to.be
          .false;
      });
      it("Should a admin account renounce DEFAULT_ADMIN role", async function () {
        const {ethPoolProxy, owner, DEFAULT_ADMIN_ROLE} = await loadFixture(
          ethPoolProxyFixture
        );

        await expect(
          ethPoolProxy
            .connect(owner)
            .renounceRole(DEFAULT_ADMIN_ROLE, owner.address)
        )
          .to.emit(ethPoolProxy, "RoleRevoked")
          .withArgs(DEFAULT_ADMIN_ROLE, owner.address, owner.address);
        expect(await ethPoolProxy.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to
          .be.false;
      });

      it("Should a manager account renounce MANAGER role", async function () {
        const {ethPoolProxy, manager, accountE, MANAGER_ROLE} =
          await loadFixture(ethPoolProxyFixture);

        await expect(
          ethPoolProxy
            .connect(manager)
            .renounceRole(MANAGER_ROLE, manager.address)
        )
          .to.emit(ethPoolProxy, "RoleRevoked")
          .withArgs(MANAGER_ROLE, manager.address, manager.address);
        expect(await ethPoolProxy.hasRole(MANAGER_ROLE, manager.address)).to.be
          .false;
      });

      it("Should a team member account renounce TEAM role", async function () {
        const {ethPoolProxy, teamMember, TEAM_ROLE} = await loadFixture(
          ethPoolProxyFixture
        );

        await expect(
          ethPoolProxy
            .connect(teamMember)
            .renounceRole(TEAM_ROLE, teamMember.address)
        )
          .to.emit(ethPoolProxy, "RoleRevoked")
          .withArgs(TEAM_ROLE, teamMember.address, teamMember.address);
        expect(await ethPoolProxy.hasRole(TEAM_ROLE, teamMember.address)).to.be
          .false;
      });
    });
  });
});
