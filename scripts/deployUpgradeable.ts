import {ethers, upgrades, run} from "hardhat";
import {sleep} from "./sleep";

async function main() {
  const [admin, manager, teamMember] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", admin.address);

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

  console.log(
    `ETHPoolUpgradeable's proxy deployed to '${ethPoolProxy.address}'`
  );
  console.log(`Admin: '${admin.address}'`);
  console.log(`Manager: '${manager.address}'`);

  const TEAM_ROLE = await ethPoolProxy.TEAM_ROLE();
  await ethPoolProxy.connect(admin).grantRole(TEAM_ROLE, teamMember.address);
  console.log(`Team member: '${teamMember.address}'`);

  console.log("Sleeping.....");
  // Wait for etherscan to notice that the contract has been deployed
  await sleep(60000);

  // Verify the contract after deploying
  await run("verify", {
    address: ethPoolProxy.address,
    constructorArguments: [manager.address],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
