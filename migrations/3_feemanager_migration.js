const FeeManager = artifacts.require("FeeManager");

module.exports = async function (deployer) {
  const DEFAULT_FEE = 500;
  await deployer.deploy(FeeManager, DEFAULT_FEE);
};
