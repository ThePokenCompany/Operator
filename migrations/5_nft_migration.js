const NFTToken = artifacts.require("NFTToken");
require("dotenv").config();

module.exports = async function (deployer, network) {
  await deployer.deploy(NFTToken, process.env.TOKEN_BASEURI);
};
