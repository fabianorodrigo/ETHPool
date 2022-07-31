import {task} from "hardhat/config";

task("poolBalance", "Check the total amount of ETH held in the contract")
  .addParam(
    "address",
    "The ETHPool or ETHPoolUpgradeable's proxy address",
    "0xd201C8566634216B49c2d9668A646DAfc59f21ca"
  )
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.address);
    console.log(`Pool balance: ETH ${balance}`);
  });
