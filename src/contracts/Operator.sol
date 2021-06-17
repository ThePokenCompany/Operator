// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./FeeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Operator is Ownable {
    address private feeManager;
    address private feeRecipient;

    event SaleAwarded(address from, address to, uint tokenId);
    event ItemGifted(address from, address to, uint tokenId);
    
    constructor(address _feeManager, address _feeRecipient) {
        feeManager = _feeManager;
        feeRecipient = _feeRecipient;
    }

    function changeFeeManager(address _feeManager) public onlyOwner {
        feeManager = _feeManager;
    }

    function changeFeeRecipient(address _feeRecipient) public onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function getFeeManager() public view onlyOwner returns(address) {
        return feeManager;
    }

    function getFeeRecipient() public view onlyOwner returns(address) {
        return feeRecipient;
    }

    function awardItem(uint tokenId, address buyer, uint price, address nftContract, address owner, address currency) public onlyOwner {
        require(buyer != address(0), "Buyer cannot be the zero address");
        require(owner != address(0), "Owner cannot be the zero address");
        require(price > 0, "Price should be greater than zero");

        uint commission = FeeManager(feeManager).getPartnerFee(owner);
        require(commission > 0, "Commission cannot be 0");
        uint fee = price * commission /10000;
        uint amount = price - fee;

        ERC20(currency).transferFrom(buyer, owner, amount);
        ERC20(currency).transferFrom(buyer, feeRecipient, fee);
        ERC721(nftContract).safeTransferFrom(owner, buyer, tokenId);
        emit SaleAwarded(owner, buyer, tokenId);
    }

    // TODO: To be tested
    function giftItem(uint tokenId, address receiver, address nftContract, address owner) public onlyOwner {
        require(receiver != address(0), "receiver cannot be the zero address");
        require(owner != address(0), "Owner cannot be the zero address");

        ERC721(nftContract).safeTransferFrom(owner, receiver, tokenId);
        emit ItemGifted(owner, receiver, tokenId);
    }
}