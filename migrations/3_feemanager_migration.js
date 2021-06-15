const FeeManager = artifacts.require("FeeManager");

module.exports = async function (deployer) {
  await deployer.deploy(FeeManager);
};
