// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTToken is ERC721URIStorage {
    constructor() ERC721("NFT Token", "NFT") {
    }

    function mint(uint tokenId) public {
        _safeMint(msg.sender, tokenId);
    } 
}