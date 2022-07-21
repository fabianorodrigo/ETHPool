import {ethers} from "hardhat";

async function main() {
  const [deployer, manager, teamMember] = await ethers.getSigners();
  const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
  const ethPool = await ETHPoolFactory.deploy(manager.address);
  await ethPool.deployed();
  console.log(`ETHPool deployed to '${ethPool.address}'`);
  console.log(`Admin: '${deployer.address}'`);
  console.log(`Manager: '${manager.address}'`);

  const TEAM_ROLE = await ethPool.TEAM_ROLE();
  await ethPool.connect(deployer).grantRole(TEAM_ROLE, teamMember.address);
  console.log(`Team member: '${teamMember.address}'`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
