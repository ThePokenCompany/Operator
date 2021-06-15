require("dotenv").config();

const Operator = artifacts.require("Operator");
const GoldToken = artifacts.require("GoldToken");
const FeeManager = artifacts.require("FeeManager");

module.exports = async function (deployer, network, accounts) {
  console.log("network = ", network);

  let currencyAddress = 0;
  let tokenRecipient = 0;
  if (network === "development") {
    const currency = await GoldToken.deployed();
    currencyAddress = currency.address;
    tokenRecipient = accounts[1];
  }

  const fee = await FeeManager.deployed();
  let feeAddress = FeeManager.network.address;

  if (network !== "development") {
    currencyAddress = process.env.CURRENCY_ADDRESS;
    tokenRecipient = process.env.TOKEN_RECIPIENT;
  }

  await deployer.deploy(Operator, currencyAddress, feeAddress, tokenRecipient);
};
