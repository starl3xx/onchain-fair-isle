// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FairIsleNFT
 * @notice Generative Fair Isle knitting pattern NFTs on Base L2
 * @dev Pattern is deterministically generated from tokenId off-chain
 */
contract FairIsleNFT is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ============ Constants ============
    uint256 public constant MINT_PRICE = 0.002 ether;

    // ============ State ============
    uint256 private _tokenIdCounter;
    address public treasury;
    string public baseTokenURI;
    bool public mintingEnabled = true;
    uint256 public maxSupply; // 0 = unlimited

    // ============ Events ============
    event Minted(address indexed to, uint256 indexed tokenId);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event BaseURIUpdated(string newBaseURI);
    event MintingToggled(bool enabled);

    // ============ Errors ============
    error InsufficientPayment();
    error MintingDisabled();
    error MaxSupplyReached();
    error TransferFailed();
    error InvalidTreasury();

    constructor(
        address _treasury,
        string memory _baseURI,
        uint256 _maxSupply
    ) ERC721("Fair Isle", "FAIRISLE") Ownable(msg.sender) {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
        baseTokenURI = _baseURI;
        maxSupply = _maxSupply;
    }

    // ============ Minting ============

    function mint() external payable nonReentrant returns (uint256) {
        if (!mintingEnabled) revert MintingDisabled();
        if (msg.value < MINT_PRICE) revert InsufficientPayment();
        if (maxSupply > 0 && _tokenIdCounter >= maxSupply) revert MaxSupplyReached();

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);

        // Transfer funds to treasury immediately
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit Minted(msg.sender, tokenId);
        return tokenId;
    }

    // ============ View Functions ============

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function nextTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // ============ Owner Functions ============

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseTokenURI = _baseURI;
        emit BaseURIUpdated(_baseURI);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidTreasury();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
        emit MintingToggled(_enabled);
    }

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply == 0 || _maxSupply >= _tokenIdCounter, "Cannot set below current supply");
        maxSupply = _maxSupply;
    }

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = treasury.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }
}
