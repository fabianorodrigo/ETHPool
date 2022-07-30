import {ethers} from "hardhat";

// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshopt in every test.
export async function deployETHPoolFixture() {
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

  const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
  const ethPool = await ETHPoolFactory.deploy(manager.address);

  const DEFAULT_ADMIN_ROLE = await ethPool.DEFAULT_ADMIN_ROLE();
  const MANAGER_ROLE = await ethPool.MANAGER_ROLE();
  const TEAM_ROLE = await ethPool.TEAM_ROLE();

  await ethPool.connect(manager).grantRole(TEAM_ROLE, teamMember.address);
  await ethPool.connect(manager).grantRole(TEAM_ROLE, teamMemberB.address);

  return {
    ethPool,
    owner,
    manager,
    teamMember,
    teamMemberB,
    accountA,
    accountB,
    accountC,
    accountD,
    accountE,
    DEFAULT_ADMIN_ROLE,
    MANAGER_ROLE,
    TEAM_ROLE,
  };
}
