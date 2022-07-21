import {ethers, upgrades} from "hardhat";

async function main() {
  const [deployer, manager, teamMember] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const ETHPoolUpgradeableFactory = await ethers.getContractFactory(
    "ETHPoolUpgradeable"
  );
  const ethPoolProxy = await upgrades.deployProxy(
    ETHPoolUpgradeableFactory,
    [manager.address],
    {
      kind: "uups",
    }
  );
  await ethPoolProxy.deployed();
  console.log("ETHPoolUpgradeable's proxy deployed to:", ethPoolProxy.address);
  console.log(`Admin: '${deployer.address}'`);
  console.log(`Manager: '${manager.address}'`);

  const TEAM_ROLE = await ethPoolProxy.TEAM_ROLE();
  await ethPoolProxy.connect(deployer).grantRole(TEAM_ROLE, teamMember.address);
  console.log(`Team member: '${teamMember.address}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
