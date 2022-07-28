import {task} from "hardhat/config";

task("ETHPoolUserBalance", "Check a user current balance (deposits + rewards)")
  .addParam("user", "The user address to check the balance for")
  .addParam(
    "address",
    "The ETHPool contract address",
    "0xBb796dbD5107C5B8409A3D291b77505C01Ee281D"
  )
  .setAction(async (taskArgs, hre) => {
    const ETHPool = await hre.ethers.getContractFactory("ETHPool");
    const ethPool = ETHPool.attach(taskArgs.address);
    const balance = await ethPool.balances(taskArgs.user);
    console.log(`${taskArgs.user} balance: ETH ${balance}`);
  });
