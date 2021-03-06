// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeManager is Ownable {
    uint256 private defaultFee;
    mapping(address => uint256) private partnerFeeAggreement;

    constructor(uint _defaultFee){
        defaultFee = _defaultFee;
    }

    event FeeUpdated(address partner, uint256 fee);

    function setPartnerFee(address partner, uint256 fee) public onlyOwner {
        require(fee > 0, "Fee must be greater than 0");
        require(
            partnerFeeAggreement[partner] == 0,
            "Edit partner fee require partner approval"
        );
        partnerFeeAggreement[partner] = fee;
    }

    // TODO: To be tested
    function setDefaultFee(uint256 fee) public onlyOwner {
        require(fee > 0, "Fee must be greater than 0");

        defaultFee = fee;
    }

    function updatePartnerFee(address partner, uint256 fee) public onlyOwner {
        require(fee > 0, "Fee must be greater than 0");
        require(partnerFeeAggreement[partner] > 0, "Partner fee is not set. ");
        partnerFeeAggreement[partner] = fee;

        emit FeeUpdated(partner, fee);
    }

    function getPartnerFee(address partner) public view returns (uint256) {
        return
            partnerFeeAggreement[partner] > 0
                ? partnerFeeAggreement[partner]
                : defaultFee;
    }
}
