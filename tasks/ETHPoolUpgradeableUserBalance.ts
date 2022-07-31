import {task} from "hardhat/config";

task(
  "ETHPoolUpgradeableUserBalance",
  "Check a user current balance (deposits + rewards)"
)
  .addParam("user", "The user address to check the balance for")
  .addParam(
    "proxyaddress",
    "The ETHPoolUpgradeable's proxy contract address",
    "0xd201C8566634216B49c2d9668A646DAfc59f21ca"
  )
  .setAction(async (taskArgs, hre) => {
    const ETHPoolUpgradeable = await hre.ethers.getContractFactory(
      "ETHPoolUpgradeable"
    );
    const ethPoolProxy = ETHPoolUpgradeable.attach(taskArgs.proxyaddress);
    const balance = await ethPoolProxy.balances(taskArgs.user);
    console.log(`${taskArgs.user} balance: ETH ${balance}`);
  });
