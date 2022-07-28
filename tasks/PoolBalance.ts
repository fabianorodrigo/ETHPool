import {task} from "hardhat/config";

task("poolBalance", "Check the total amount of ETH held in the contract")
  .addParam(
    "address",
    "The ETHPool or ETHPoolUpgradeable's proxy address",
    "0xBb796dbD5107C5B8409A3D291b77505C01Ee281D"
  )
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.address);
    console.log(`ETHPool balance: ${balance}`);
  });

//
