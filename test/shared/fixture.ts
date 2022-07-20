import {ethers} from "hardhat";

// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshopt in every test.
export async function deployETHPoolFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, accountA, accountB, accountC, accountD] =
    await ethers.getSigners();

  const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
  const ethPool = await ETHPoolFactory.deploy();

  return {
    ethPool,
    owner,
    accountA,
    accountB,
    accountC,
    accountD,
  };
}
