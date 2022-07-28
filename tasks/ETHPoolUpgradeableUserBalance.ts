import {task} from "hardhat/config";

task(
  "ETHPoolUpgradeableUserBalance",
  "Check a user current balance (deposits + rewards)"
)
  .addParam("user", "The user address to check the balance for")
  .addParam(
    "proxyaddress",
    "The ETHPoolUpgradeable's proxy contract address",
    "0x30168629686245047e7774F9A190c1824eFD52A0"
  )
  .setAction(async (taskArgs, hre) => {
    const ETHPoolUpgradeable = await hre.ethers.getContractFactory(
      "ETHPoolUpgradeable"
    );
    const ethPoolProxy = ETHPoolUpgradeable.attach(taskArgs.proxyaddress);
    const balance = await ethPoolProxy.balances(taskArgs.user);
    console.log(`${taskArgs.user} balance: ETH ${balance}`);
  });
