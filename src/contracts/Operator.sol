// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./FeeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC2981Royalties.sol";
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

contract TokenMover is Ownable {
    mapping(address => bool) internal _isOperator;

    modifier onlyOperator() {
        require(_isOperator[_msgSender()], "Caller is not the operator");
        _;
    }
    function addOperator(address _operator) public onlyOwner {
        require(!_isOperator[_operator], "Address already added as operator");
        _isOperator[_operator] = true;
    }

    function removeOperator(address _operator) public onlyOwner {
        require(_isOperator[_operator], "Address is not added as operator");
        _isOperator[_operator] = false;
    }

    function transferERC20(address currency, address from, address to, uint amount) public onlyOperator {
        ERC20(currency).transferFrom(from, to, amount);
    }

    function transferERC721(address currency, address from, address to, uint tokenId) public onlyOperator {
        ERC721(currency).safeTransferFrom(from, to, tokenId);
    }
}

contract Operator is Ownable {
    address private feeManager;
    address private feeRecipient;
    TokenMover public tokenMover;

    event SaleAwarded(address from, address to, uint tokenId);
    event ItemGifted(address from, address to, uint tokenId);
    event RoyaltyTransferred(address from, address to, uint amount);

    constructor(address _feeManager, address _feeRecipient, address _TokenMover) {
        feeManager = _feeManager;
        feeRecipient = _feeRecipient;
        tokenMover = TokenMover(_TokenMover);
    }

    function changeFeeManager(address _feeManager) public onlyOwner {
        feeManager = _feeManager;
    }

    function changeFeeRecipient(address _feeRecipient) public onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function getFeeManager() public view returns(address) {
        return feeManager;
    }

    function getFeeRecipient() public view returns(address) {
        return feeRecipient;
    }

    function awardItem(uint tokenId, address buyer, uint price, address nftContract, address owner, address currency) public onlyOwner {
        require(buyer != address(0), "Buyer cannot be the zero address");
        require(owner != address(0), "Owner cannot be the zero address");
        require(price > 0, "Price should be greater than zero");

        address receiver = address(0);
        uint royaltyAmount = 0;


        if(ERC165(nftContract).supportsInterface(type(IERC2981Royalties).interfaceId)){
            (address _receiver, uint256 _royaltyAmount) = IERC2981Royalties(nftContract).royaltyInfo(tokenId, price);

            if(owner != _receiver){
                receiver = _receiver;
                royaltyAmount = _royaltyAmount;
            }
        }

        uint commission = FeeManager(feeManager).getPartnerFee(owner);
        require(commission > 0, "Commission cannot be 0");
        uint fee = price * commission /10000;
        uint amount = price - fee - royaltyAmount;

        tokenMover.transferERC20(currency, buyer, owner, amount);
        tokenMover.transferERC20(currency, buyer, feeRecipient, fee);
        if(receiver != address(0)){
            tokenMover.transferERC20(currency, buyer, receiver, royaltyAmount);
            emit RoyaltyTransferred(buyer, receiver, royaltyAmount);
        }
        tokenMover.transferERC721(nftContract, owner, buyer, tokenId);
        emit SaleAwarded(owner, buyer, tokenId);
    }

    function giftItem(uint tokenId, address receiver, address nftContract, address owner) public onlyOwner {
        require(receiver != address(0), "receiver cannot be the zero address");
        require(owner != address(0), "Owner cannot be the zero address");

        tokenMover.transferERC721(nftContract, owner, receiver, tokenId);
        emit ItemGifted(owner, receiver, tokenId);
    }
}
