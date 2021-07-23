require("dotenv").config();

const Operator = artifacts.require("Operator");

module.exports = async function (deployer, network, accounts) {
  let feeRecipient = 0;
  let feeAddress = 0;
  let FeeManager = null;
  if (network === "development") {
    feeRecipient = accounts[1];
    FeeManager = artifacts.require("FeeManager");
    feeAddress = FeeManager.network.address;
  }

  if (network !== "development") {
    feeRecipient = process.env.TOKEN_RECIPIENT;
    feeAddress = process.env.FEE_ADDRESS;
  }
  await deployer.deploy(Operator, feeAddress, feeRecipient);
};
