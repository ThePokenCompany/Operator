require("dotenv").config();

const Operator = artifacts.require("Operator");
//const FeeManager = artifacts.require("FeeManager");

module.exports = async function (deployer, network, accounts) {
  let currencyAddress = 0;
  let feeRecipient = 0;
  if (network === "development") {
    feeRecipient = accounts[1];
  }
  //const fee = await FeeManager.deployed();
  let feeAddress =
    "0xf5aabff4b180770d920232e7ec68bb4827bac497"; /*FeeManager.network.address;*/
  if (network !== "development") {
    currencyAddress = process.env.CURRENCY_ADDRESS;
    feeRecipient = process.env.TOKEN_RECIPIENT;
  }
  await deployer.deploy(Operator, feeAddress, feeRecipient);
};
