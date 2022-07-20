import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {deployETHPoolFixture} from "./shared/fixture";
import {UtilsTest} from "./Utils";

describe("ETHPool", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const ETHPoolFixture = deployETHPoolFixture;

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {ethPool, owner} = await loadFixture(ETHPoolFixture);

      expect(await ethPool.owner()).to.equal(owner.address);
    });

    // it("Should receive and store the funds to lock", async function () {
    //   const {ethPool, lockedAmount} = await loadFixture(ETHPoolFixture);

    //   // expect(await ethers.provider.getBalance(lock.address)).to.equal(
    //   //   lockedAmount
    //   // );
    // });
  });
});
