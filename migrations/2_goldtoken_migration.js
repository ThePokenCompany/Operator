const GoldToken = artifacts.require("GoldToken");

module.exports = async function (deployer, network) {
  if (network === "development") {
    await deployer.deploy(GoldToken, "9000000000000000000");
  }
};
