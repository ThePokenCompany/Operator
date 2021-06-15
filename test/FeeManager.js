const FeeManager = artifacts.require("./FeeManager.sol");

require("chai").use(require("chai-as-promised")).should();

contract("FeeManager", async ([deployer, partner1, partner2]) => {
  let manager;

  before(async () => {
    manager = await FeeManager.deployed();
  });

  describe("Deployment", async () => {
    it("deploys successfully", async () => {
      assert.notEqual(manager.address, 0x0);
      assert.notEqual(manager.address, "");
      assert.notEqual(manager.address, null);
      assert.notEqual(manager.address, undefined);
    });
  });

  describe("Manage partner fee", () => {
    it("rejects update fee for partner that is not set before", async () => {
      let newFee = 3000;
      await manager.updatePartnerFee(partner1, newFee).should.be.rejected;
    });

    it("sets fee for partner", async () => {
      let fee = 500;
      await manager.setPartnerFee(partner1, fee);

      let partnerFee = await manager.getPartnerFee(partner1);
      expect(partnerFee.toNumber()).to.be.equal(fee);
    });

    it("updates fee for partner", async () => {
      let newFee = 3000;
      let result = await manager.updatePartnerFee(partner1, newFee);
      let partnerFee = await manager.getPartnerFee(partner1);
      expect(partnerFee.toNumber()).to.be.equal(newFee);

      const updatedEvent = result.logs.find((l) => l.event === "FeeUpdated");
      expect(updatedEvent.args.partner).to.be.equal(partner1);
      expect(updatedEvent.args.fee.toNumber()).to.be.equal(newFee);
    });

    it("rejects setting fee for partner when it's already set", async () => {
      let newFee = 300;
      await manager.setPartnerFee(partner1, newFee).should.be.rejected;
    });

    it("rejects setting fee with value zero", async () => {
      await manager.setPartnerFee(partner1, 0).should.be.rejected;
    });

    it("rejects updating fee with value zero", async () => {
      await manager.updatePartnerFee(partner1, 0).should.be.rejected;
    });
  });
});
