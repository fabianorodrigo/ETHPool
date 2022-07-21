import {ethers, upgrades} from "hardhat";
import {ETHPoolUpgradeable} from "../../typechain-types";

// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshopt in every test.
export async function deployETHPoolUpgradeableFixture() {
  // Contracts are deployed using the first signer/account by default
  const [
    owner,
    manager,
    teamMember,
    teamMemberB,
    accountA,
    accountB,
    accountC,
    accountD,
    accountE,
  ] = await ethers.getSigners();

  const ETHPoolUpgradeableFactory = await ethers.getContractFactory(
    "ETHPoolUpgradeable"
  );

  //const ethPool = await ETHPoolFactory.deploy(manager.address);
  const ethPoolProxy = (await upgrades.deployProxy(
    ETHPoolUpgradeableFactory,
    [manager.address],
    {
      kind: "uups",
    }
  )) as ETHPoolUpgradeable;

  const TEAM_ROLE = await ethPoolProxy.TEAM_ROLE();
  const TEAM_ADMIN_ROLE = await ethPoolProxy.getRoleAdmin(TEAM_ROLE);

  await ethPoolProxy.connect(owner).grantRole(TEAM_ROLE, teamMember.address);
  await ethPoolProxy.connect(manager).grantRole(TEAM_ROLE, teamMemberB.address);

  return {
    ethPoolProxy,
    owner,
    manager,
    teamMember,
    teamMemberB,
    accountA,
    accountB,
    accountC,
    accountD,
    accountE,
    TEAM_ADMIN_ROLE,
    TEAM_ROLE,
  };
}
