const NFTToken = artifacts.require("NFTToken");

module.exports = async function (deployer, network) {
  if (network === "development") {
    await deployer.deploy(NFTToken);
  }
};
