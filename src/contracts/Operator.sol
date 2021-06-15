// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./FeeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Operator is Ownable {
    address private currency;
    address private feeManager;
    address private tokenRecipient;

    event SaleAwarded(address from, address to, uint tokenId);
    
    constructor(address _currency, address _feeManager, address recipient) {
        currency = _currency;
        feeManager = _feeManager;
        tokenRecipient = recipient;
    }

    function changeCurrency(address _currency) public onlyOwner {
        currency = _currency;
    }

    function changeFeeManager(address _feeManager) public onlyOwner {
        feeManager = _feeManager;
    }

    function changeFeeRecipient(address recipient) public onlyOwner {
        tokenRecipient = recipient;
    }

    function getCurrency() public view onlyOwner returns(address)  {
        return currency;
    }

    function getFeeManager() public view onlyOwner returns(address) {
        return feeManager;
    }

    function getFeeRecipient() public view onlyOwner returns(address) {
        return tokenRecipient;
    }

    function awardItem(uint tokenId, address buyer, uint price, address nftContract, address owner) public onlyOwner {
        require(buyer != address(0), "Buyer cannot be the zero address");
        require(owner != address(0), "Owner cannot be the zero address");
        require(price > 0, "Price should be greater than zero");

        uint commission = FeeManager(feeManager).getPartnerFee(owner);
        require(commission > 0, "Commission cannot be 0");
        uint fee = price * commission /10000;
        uint amount = price - fee;

        ERC20(currency).transferFrom(buyer, owner, amount);
        ERC20(currency).transferFrom(buyer, tokenRecipient, fee);
        ERC721(nftContract).safeTransferFrom(owner, buyer, tokenId);
        emit SaleAwarded(owner, buyer, tokenId);
    }
}