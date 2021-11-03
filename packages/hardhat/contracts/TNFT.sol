pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 

contract TNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    struct NFT {
        address collectionAddress;
        uint256 tokenId;
    }
    mapping (uint256 => NFT) private tokenIdToNft;
    mapping(address => uint256) private collectionToTokenCount;
    address tangeloManager;
    constructor() ERC721("Tangelo NFT", "TNFT") {}

    function mintReceipt(address borrower, address collectionAddress, uint256 token)
        public
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _mint(borrower, tokenId);
        tokenIdToNft[tokenId] = NFT(collectionAddress, token);
        collectionToTokenCount[collectionAddress]++;
        return tokenId;
    }
    function burn(uint256 tokenId) public onlyManager returns (address) {
        collectionToTokenCount[tokenIdToNft[tokenId].collectionAddress]--;
        _burn(tokenId);
    }
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }
    function getNFTforTokenId(uint256 tokenId) public view returns (address, uint256) {
        return (tokenIdToNft[tokenId].collectionAddress, tokenIdToNft[tokenId].tokenId);
    }
    function getCollectionForTokenId(uint256 tokenId) public view returns (address) {
        return tokenIdToNft[tokenId].collectionAddress;
    }
    function getCollectionToTokenCount(address collection) public view returns (uint256) {
        return collectionToTokenCount[collection];
    }
    function setContractManager(address manager) public {
        tangeloManager = manager;
    }
    modifier onlyManager {
        require(msg.sender == tangeloManager);
        _;
    }

}