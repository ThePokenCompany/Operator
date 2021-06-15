const { address } = require("faker");

const Operator = artifacts.require("./Operator.sol");
const GoldToken = artifacts.require("GoldToken");
const FeeManager = artifacts.require("FeeManager");
const NFTToken = artifacts.require("NFTToken");

require("chai").use(require("chai-as-promised")).should();

contract(
  "Operator",
  async ([
    deployer,
    recipient,
    newRecipient,
    owner,
    buyer,
    buyerWithNoFunds,
  ]) => {
    let operator;
    let token;
    let manager;
    let nft;
    let tokenId = 1;
    let tokenPrice = 1000;

    before(async () => {
      operator = await Operator.deployed();
      token = await GoldToken.deployed();
      manager = await FeeManager.deployed();
      nft = await NFTToken.deployed();

      await manager.setPartnerFee(owner, 500);

      await nft.mint(tokenId, { from: owner });
      await token.transfer(buyer, "1000000");

      await token.approve(
        operator.address,
        "10000000000000000000000000000000000000",
        { from: buyer }
      );

      let res = await nft.approve(operator.address, tokenId, { from: owner });
    });

    describe("Deployment", async () => {
      it("deploys successfully", async () => {
        assert.notEqual(operator.address, 0x0);
        assert.notEqual(operator.address, "");
        assert.notEqual(operator.address, null);
        assert.notEqual(operator.address, undefined);
      });
    });

    describe("Contract configuration", () => {
      it("has the correct currency", async () => {
        let currency = await operator.getCurrency();
        expect(currency).to.be.equal(token.address);
      });

      it("has the correct fee manager", async () => {
        let _manager = await operator.getFeeManager();
        expect(_manager).to.be.equal(manager.address);
      });

      it("has the correct recipient", async () => {
        let _recipient = await operator.getFeeRecipient();
        expect(_recipient).to.be.equal(recipient);
      });

      // Update contract config
      it("updates the currency", async () => {
        let newCurrency = await GoldToken.new("1000000000000000000");
        await operator.changeCurrency(newCurrency.address);
        let currency = await operator.getCurrency();
        expect(currency).to.be.equal(newCurrency.address);
        await operator.changeCurrency(token.address);
      });

      it("updates the fee manager", async () => {
        let newFee = await FeeManager.new();
        await operator.changeFeeManager(newFee.address);
        let _manager = await operator.getFeeManager();
        expect(_manager).to.be.equal(newFee.address);
        await operator.changeFeeManager(manager.address);
      });

      it("updates the recipient", async () => {
        await operator.changeFeeRecipient(newRecipient);
        let _recipient = await operator.getFeeRecipient();
        expect(_recipient).to.be.equal(newRecipient);
        await operator.changeFeeRecipient(recipient);
      });
    });

    describe("Award NFT to the auction winner", () => {
      it("rejects if buyer is the zero address", async () => {
        await operator.awardItem(tokenId, 0, "1000", nft.address, owner).should
          .be.rejected;
      });

      it("rejects if owner is the zero address", async () => {
        await operator.awardItem(tokenId, buyer, "1000", nft.address, 0).should
          .be.rejected;
      });

      it("rejects if price is zero", async () => {
        await operator.awardItem(tokenId, buyer, "0", nft.address, owner).should
          .be.rejected;
      });

      it("rejects if buyer balance is unsufficient", async () => {
        await operator.awardItem(
          tokenId,
          buyerWithNoFunds,
          tokenPrice,
          nft.address,
          owner
        ).should.be.rejected;
      });

      it("transfers NFT to buyer, transfer the price - fee to the the owner, transfers the fee to token recipient", async () => {
        let buyerBalanceBefore = await token.balanceOf(buyer);

        let receipt = await operator.awardItem(
          tokenId,
          buyer,
          tokenPrice,
          nft.address,
          owner,
          { from: deployer }
        );

        const awardedEvent = receipt.logs.find(
          (l) => l.event === "SaleAwarded"
        );

        expect(awardedEvent.args.from).to.be.equal(owner);
        expect(awardedEvent.args.to).to.be.equal(buyer);
        expect(awardedEvent.args.tokenId.toNumber()).to.be.equal(tokenId);

        let ownerBalance = await token.balanceOf(owner);
        let buyerBalance = await token.balanceOf(buyer);
        let recipientBalance = await token.balanceOf(recipient);
        let commission = await manager.getPartnerFee(owner);
        let fee = (tokenPrice * commission) / 10000;
        let amount = tokenPrice - fee;

        expect(ownerBalance.toNumber()).to.be.equal(amount);
        expect(buyerBalance.toNumber()).to.be.equal(
          buyerBalanceBefore.toNumber() - tokenPrice
        );
        expect(recipientBalance.toNumber()).to.be.equal(fee);
      });
    });
  }
);
