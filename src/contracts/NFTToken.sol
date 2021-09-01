// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC2981Royalties.sol";

contract NFTToken is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, IERC2981Royalties {
    struct Royalty {
        address recipient;
        uint256 value;
    }
    string internal baseUri;
    mapping(uint256 => Royalty) internal _royalties;
    mapping(address => bool) internal _isApp;

    constructor(string memory _baseURI_) ERC721("RarePorn", "NFP") {
        setBaseURI(_baseURI_);
    }

    modifier onlyApp() {
        require(_isApp[_msgSender()], "Caller is not the app");
        _;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return interfaceId == type(IERC2981Royalties).interfaceId
            || super.supportsInterface(interfaceId);
    }

    /// @dev Sets token royalties
    /// @param id the token id fir which we register the royalties
    /// @param recipient recipient of the royalties
    /// @param value percentage (using 2 decimals - 10000 = 100, 0 = 0)
    function _setTokenRoyalty(
        uint id,
        address recipient,
        uint256 value
    ) internal {
        require(value <= 10000, 'ERC2981Royalties: Too high');

        _royalties[id] = Royalty(recipient, value);
    }

    /// @notice Called with the sale price to determine how much royalty is owed and to whom.
    /// @param _tokenId - the NFT asset queried for royalty information
    /// @param _value - the sale price of the NFT asset specified by _tokenId
    /// @return _receiver - address of who should be sent the royalty payment
    /// @return _royaltyAmount - the royalty payment amount for value sale price
    function royaltyInfo(uint256 _tokenId, uint256 _value)
        external
        override
        view
        returns (address _receiver, uint256 _royaltyAmount)
    {
        Royalty memory royalty = _royalties[_tokenId];
        return (royalty.recipient, (_value * royalty.value) / 10000);
    }

    function mint(uint tokenId, address royaltyRecipient, uint royaltyPercentage, string memory _uri) public {
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);
        _setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage);
    }

    function mintForSomeoneAndBuy(uint tokenId, address royaltyRecipient, uint royaltyPercentage, string memory _uri, address buyer) public onlyApp {
        _safeMint(royaltyRecipient, tokenId);
        _setTokenURI(tokenId, _uri);
        _setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage);
        _safeTransfer(royaltyRecipient, buyer, tokenId, "");
    }

    /**
     * @dev Base URI for computing {tokenURI}. Empty by default, can be overriden
     * in child contracts.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory _baseUri) public onlyOwner {
        require(bytes(_baseUri).length > 0);
        baseUri = _baseUri;
    }

    function addApp(address _app) public onlyOwner {
        require(!_isApp[_app], "Address already added as app");
        _isApp[_app] = true;
    }

    function removeApp(address _app) public onlyOwner {
        require(_isApp[_app], "Address is not added as app");
        _isApp[_app] = false;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
