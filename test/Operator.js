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
    newBuyer,
  ]) => {
    let operator;
    let token;
    let manager;
    let nft;
    let tokenId = 1;
    let tokenPrice = 1000;
    let royaltyPercentage = 500;

    before(async () => {
      operator = await Operator.deployed();
      token = await GoldToken.deployed();
      manager = await FeeManager.deployed();
      nft = await NFTToken.deployed();

      await nft.mint(tokenId, owner, royaltyPercentage, tokenId.toString(), {
        from: owner,
      });
      await token.transfer(buyer, "1000000");
      await token.transfer(newBuyer, "1000000");

      await token.approve(
        operator.address,
        "10000000000000000000000000000000000000",
        { from: buyer }
      );

      await token.approve(
        operator.address,
        "10000000000000000000000000000000000000",
        { from: newBuyer }
      );

      await nft.approve(operator.address, tokenId, { from: owner });
    });

    describe("Deployment", async () => {
      it("deploys successfully", async () => {
        assert.notEqual(operator.address, 0x0);
        assert.notEqual(operator.address, "");
        assert.notEqual(operator.address, null);
        assert.notEqual(operator.address, undefined);
      });
    });

    describe("Contract configuration", async () => {
      it("has the correct fee manager", async () => {
        let _manager = await operator.getFeeManager();
        expect(_manager).to.be.equal(manager.address);
      });

      it("has the correct recipient", async () => {
        let _recipient = await operator.getFeeRecipient();
        expect(_recipient).to.be.equal(recipient);
      });

      // Update contract config

      it("updates the fee manager", async () => {
        let newFee = await FeeManager.new(400);
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

    describe("Award NFT to the auction winner", async () => {
      it("rejects if buyer is the zero address", async () => {
        await operator.awardItem(
          tokenId,
          0,
          "1000",
          nft.address,
          owner,
          token.address
        ).should.be.rejected;
      });

      it("rejects if owner is the zero address", async () => {
        await operator.awardItem(
          tokenId,
          buyer,
          "1000",
          nft.address,
          0,
          token.address
        ).should.be.rejected;
      });

      it("rejects if price is zero", async () => {
        await operator.awardItem(
          tokenId,
          buyer,
          "0",
          nft.address,
          owner,
          token.address
        ).should.be.rejected;
      });

      it("rejects if buyer balance is unsufficient", async () => {
        await operator.awardItem(
          tokenId,
          buyerWithNoFunds,
          tokenPrice,
          nft.address,
          owner,
          token.address
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
          token.address,
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

      it("transfers NFT to buyer as gift", async () => {
        let buyerBalanceBefore = await token.balanceOf(buyer);
        await nft.mint(10, owner, royaltyPercentage, "10", { from: owner });
        await nft.approve(operator.address, 10, { from: owner });

        let receipt = await operator.giftItem(10, buyer, nft.address, owner, {
          from: deployer,
        });

        const awardedEvent = receipt.logs.find((l) => l.event === "ItemGifted");

        expect(awardedEvent.args.from).to.be.equal(owner);
        expect(awardedEvent.args.to).to.be.equal(buyer);
        expect(awardedEvent.args.tokenId.toNumber()).to.be.equal(10);

        let buyerBalance = await token.balanceOf(buyer);
        expect(buyerBalance.toNumber()).to.be.equal(
          buyerBalanceBefore.toNumber()
        );
      });

      it("transfers NFT to buyer, transfer the price - fee to the the owner, transfers the fee to token recipient and transfer the royalties to the owner", async () => {
        let creator = owner;
        let newOwner = buyer;
        let buyerBalanceBefore = await token.balanceOf(newBuyer);
        let creatorBalanceBefore = await token.balanceOf(creator);
        let ownerBalanceBefore = await token.balanceOf(newOwner);
        let receipinetBalanceBefore = await token.balanceOf(recipient);

        await nft.approve(operator.address, tokenId, { from: newOwner });

        let receipt = await operator.awardItem(
          tokenId,
          newBuyer,
          tokenPrice,
          nft.address,
          newOwner,
          token.address,
          { from: deployer }
        );

        const royaltyInfo = await nft.royaltyInfo(tokenId, tokenPrice);

        expect(royaltyInfo._receiver).to.be.equal(creator);
        expect(royaltyInfo._royaltyAmount.toNumber()).to.be.equal(
          (tokenPrice * royaltyPercentage) / 10000
        );

        let ownerBalance = await token.balanceOf(newOwner);
        let buyerBalance = await token.balanceOf(newBuyer);
        let recipientBalance = await token.balanceOf(recipient);
        let creatorBalance = await token.balanceOf(creator);
        let commission = await manager.getPartnerFee(newOwner);
        let fee = (tokenPrice * commission) / 10000;
        let amount = tokenPrice - fee - royaltyInfo._royaltyAmount.toNumber();

        expect(ownerBalance.toNumber()).to.be.equal(
          ownerBalanceBefore.toNumber() + amount
        );
        expect(buyerBalance.toNumber()).to.be.equal(
          buyerBalanceBefore.toNumber() - tokenPrice
        );
        expect(recipientBalance.toNumber()).to.be.equal(
          receipinetBalanceBefore.toNumber() + fee
        );
        expect(creatorBalance.toNumber()).to.be.equal(
          creatorBalanceBefore.toNumber() +
            royaltyInfo._royaltyAmount.toNumber()
        );

        const awardedEvent = receipt.logs.find(
          (l) => l.event === "SaleAwarded"
        );

        const royaltyEvent = receipt.logs.find(
          (l) => l.event === "RoyaltyTransferred"
        );

        expect(awardedEvent.args.from).to.be.equal(buyer);
        expect(awardedEvent.args.to).to.be.equal(newBuyer);
        expect(awardedEvent.args.tokenId.toNumber()).to.be.equal(tokenId);

        expect(royaltyEvent.args.from).to.be.equal(newBuyer);
        expect(royaltyEvent.args.to).to.be.equal(owner);
        expect(royaltyEvent.args.amount.toNumber()).to.be.equal(
          royaltyInfo._royaltyAmount.toNumber()
        );
      });
    });
  }
);
