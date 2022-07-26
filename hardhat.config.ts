import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  mocha: {
    reporter: "mocha-multi-reporters",
    reporterOptions: {
      configFile: "./mocha-reporter-config.json",
    },
  },
  gasReporter: {
    showTimeSpent: true,
    //outputFile: "reports/eth-gas-reporter.txt",
    enabled: true,
  },
};

export default config;
