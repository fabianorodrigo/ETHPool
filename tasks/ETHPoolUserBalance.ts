import {task} from "hardhat/config";

task("ETHPoolUserBalance", "Check a user current balance (deposits + rewards)")
  .addParam("user", "The user address to check the balance for")
  .addParam(
    "address",
    "The ETHPool contract address",
    "0x07ef7dd35a6d364A8D2FF62621AD6B1974EEE5eE"
  )
  .setAction(async (taskArgs, hre) => {
    const ETHPool = await hre.ethers.getContractFactory("ETHPool");
    const ethPool = ETHPool.attach(taskArgs.address);
    const balance = await ethPool.balances(taskArgs.user);
    console.log(`${taskArgs.user} balance: ETH ${balance}`);
  });
