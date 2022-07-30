import * as dotenv from "dotenv";
import fs from "fs";
import {ethers, run} from "hardhat";
import {sleep} from "./sleep";
dotenv.config({path: ".env"});
require("@nomiclabs/hardhat-etherscan");

async function main() {
  const [admin, manager, teamMember] = await ethers.getSigners();
  const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
  const ethPool = await ETHPoolFactory.deploy(manager.address);
  await ethPool.deployed();
  console.log(`ETHPool deployed to '${ethPool.address}'`);
  console.log(`Admin: '${admin.address}'`);
  console.log(`Manager: '${manager.address}'`);

  const TEAM_ROLE = await ethPool.TEAM_ROLE();
  await ethPool.connect(manager).grantRole(TEAM_ROLE, teamMember.address);
  console.log(`Team member: '${teamMember.address}'`);

  fs.writeFileSync(
    "scripts/EthPool.json",
    JSON.stringify({
      contract: ethPool.address,
      admin: admin.address,
      manager: manager.address,
      teamMember: teamMember.address,
    })
  );

  console.log("Sleeping.....");
  // Wait for etherscan to notice that the contract has been deployed
  await sleep(60000);

  // Verify the contract after deploying
  await run("verify:verify", {
    address: ethPool.address,
    constructorArguments: [manager.address],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
