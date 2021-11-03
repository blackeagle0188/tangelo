pragma solidity 0.8.0;

//SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TNFT.sol";

contract Tangelo is ERC20, IERC721Receiver, Ownable, Pausable {

  uint256 vaultCap = 500 ether;
  uint256 pricePerShare = 1 ether; // ETH per Tangelo LP Share
  uint256 vaultReservePercent = 10; // 10% of total supply is reserved for withdraws
  uint256 vaultBalance;
  uint256 vaultBalanceAvailable;
  bool isAcceptingDeposits = true; // useful for migrating to new contract

  mapping (address => uint256) collectionFloorPrice; // Enabled collections map address to price
  mapping (address => uint256) collectionCollateralizationRatio; // Enabled collections map address to price
  mapping (address => uint256) collectionInterestRate; // Interest rate per 7 day lending period, 100 represents 1% interest
  mapping (address => mapping (address => uint256)) borrowBalancesForCollection; // Maps borrower to collection to outstanding balance
  mapping (address => uint256) borrowBalances; // Maps borrower to collection to outstanding balance
  mapping(address => uint256) deposits; // Map lender to amount
  address[] depositors;
  address[] borrowers;
  address[] collections; // whitelisted NFT collections
  mapping (address => bool) collectionIsActive;
  address receiptContractAddress; // issue receipt NFT claim tickets
  uint foreclosureThresholdPercent = 150; // If asset is worth less than 150% of loan, can liquidate
  uint foreclosureDicountPercent = 10;
  uint256 lastInterestPaymentTime;
  mapping(address => uint256) collectionToBorrowedAmount; // map collection to how much was borrowed against it

  event CollateralAded(address owner, address nftContractAddress, uint256 tokenId);
  event CollateralRemoved(address owner, address nftContractAddress, uint256 tokenId);
  event LoanTaken(address borrower, address nftContractAddress, uint256 tokenId);
  event LoanRepaid(address borrower, address nftContractAddress, uint256 tokenId);
  event FundsDeposited(address lender, uint256 amount);
  event FundsWithdrawn(address lender, uint256 amount);

    constructor(address receiptContract) ERC20("TANGELOLP", "TLP") public {
      receiptContractAddress = receiptContract;
      lastInterestPaymentTime = block.timestamp;
    }

  // Borrower functions -----
  function addCollateral(address nftContractAddress, uint256 tokenId) public whenNotPaused acceptingNewDeposits returns (uint256) {
    require(collectionFloorPrice[nftContractAddress] > 0, "NFT collection not supported yet");
    IERC721 nftContract = IERC721(nftContractAddress);
    nftContract.safeTransferFrom(msg.sender, address(this), tokenId);
    TNFT receiptContract = TNFT(receiptContractAddress);
    return receiptContract.mintReceipt(msg.sender, nftContractAddress, tokenId);
  }
  function removeCollateral(uint256 tokenId) public whenNotPaused {
    // TODO: Do not allow remove if loan active
    TNFT receiptContract = TNFT(receiptContractAddress);
    address owner = receiptContract.ownerOf(tokenId);
    require(owner == msg.sender, "Only this token owner can remove collateral");
    (address collectionAddress, uint token) = receiptContract.getNFTforTokenId(tokenId);
    require(borrowBalancesForCollection[owner][collectionAddress] <= getBorrowingPowerForAddress(owner) - getBorrowingPowerForTokenInCollection(collectionAddress), "Cannot remove collateral while in use for loan");
    receiptContract.burn(tokenId);
    require(receiptContract.exists(tokenId) == false, "Token not burned");
    IERC721 nftContract = IERC721(collectionAddress);
    nftContract.safeTransferFrom(address(this), msg.sender, token);
  }
  function getBorrowingPowerForAddress(address _address) public view returns (uint256) {
    TNFT receiptContract = TNFT(receiptContractAddress);
    uint256 borrowingPower = 0;
    for (uint256 i = 0; i < receiptContract.balanceOf(_address); i++) {
      uint256 tokenId = receiptContract.tokenOfOwnerByIndex(_address, i);
      address collectionAddress = receiptContract.getCollectionForTokenId(tokenId);
      borrowingPower += getBorrowingPowerForTokenInCollection(collectionAddress);
    }
    return borrowingPower;
  }
  function getBorrowingPowerForAddressAndCollection(address _address, address _collectionAddress) public view returns (uint256) {
    TNFT receiptContract = TNFT(receiptContractAddress);
    uint value = getPortfolioValueForAddressAndCollection(_address, _collectionAddress);
    uint256 borrowingPower = collectionCollateralizationRatio[_collectionAddress] * value / 100;
    return borrowingPower - borrowBalancesForCollection[_address][_collectionAddress];
  }
  function getPortfolioValueForAddressAndCollection(address _address, address _collectionAddress) public view returns (uint256) {
    TNFT receiptContract = TNFT(receiptContractAddress);
    uint256 portfolioValue = 0;
    for (uint256 i = 0; i < receiptContract.balanceOf(_address); i++) {
      uint256 tokenId = receiptContract.tokenOfOwnerByIndex(_address, i);
      address collectionAddress = receiptContract.getCollectionForTokenId(tokenId);
      if (_collectionAddress == collectionAddress) {
        portfolioValue += getFloorValueForTokenInCollection(collectionAddress);
      }
    }
    return portfolioValue;
  }

  function takeLoan(uint256 requestedAmount, address collectionAddress) public whenNotPaused acceptingNewDeposits collectionMustBeActive(collectionAddress) {
    require(requestedAmount <= getBorrowingPowerForAddressAndCollection(msg.sender, collectionAddress), "Exceeds borrow limit");
    require(requestedAmount <= vaultBalanceAvailable, "Not enough funds in vault to cover this loan");
    require(vaultBalanceAvailable - requestedAmount > vaultBalance * vaultReservePercent/100, "Transfer reduces vault balance below withrdraw reserve");
    borrowBalancesForCollection[msg.sender][collectionAddress] += requestedAmount;
    borrowBalances[msg.sender] += requestedAmount;
    borrowers.push(msg.sender);
    collectionToBorrowedAmount[collectionAddress] += requestedAmount;
    vaultBalanceAvailable = vaultBalanceAvailable - requestedAmount;
    payable(msg.sender).transfer(requestedAmount);
  }

  function repayLoan(address collectionAddress) payable public whenNotPaused {
      require(msg.value <= borrowBalancesForCollection[msg.sender][collectionAddress], "Send less than your borrow balance");
      borrowBalancesForCollection[msg.sender][collectionAddress] -= msg.value;
      borrowBalances[msg.sender] -= msg.value;
      collectionToBorrowedAmount[collectionAddress] -= msg.value;
      vaultBalanceAvailable = vaultBalanceAvailable + msg.value;
  }
  function accrueInterest() public whenNotPaused {
    uint256 timeToPayFor = block.timestamp - lastInterestPaymentTime;
    require(timeToPayFor > 1 minutes);
    lastInterestPaymentTime = block.timestamp;
    TNFT receiptContract = TNFT(receiptContractAddress);
    uint interestEarned;
    for (uint256 i = 0; i < collections.length; i++) {
      address collection = collections[i];
      uint256 interestRate = getInterestPercentForCollection(collection) / 10000;
      interestEarned += collectionToBorrowedAmount[collection] * interestRate * timeToPayFor / 365 days;

    }
      _handleRevenue(interestEarned);
  }

  // Lender vault functions -----
  function depositFunds() payable public whenNotPaused acceptingNewDeposits {
    require(msg.value > 0, "Must deposit positive amount");
    require(msg.value + vaultBalance <= vaultCap, "Vault cap exceeded");
    depositors.push(msg.sender);
    vaultBalance = vaultBalance + msg.value;
    vaultBalanceAvailable = vaultBalanceAvailable + msg.value;
    uint256 shares = 1 ether * msg.value / pricePerShare ;
    _mint(msg.sender, shares);
  }

  function withdrawFunds(uint amountRequested) public whenNotPaused {
    uint256 amountAvailableForUser = getAmountAvailableToWithdraw(msg.sender);
    require(amountRequested <= amountAvailableForUser, "Not enough funds to withdraw");
    require(amountRequested <= vaultBalanceAvailable, "Vault capital is deployed and 10% withdraw allocation was already taken");
    uint256 shares = 1 ether * amountRequested / pricePerShare;
    _burn(msg.sender, shares);
    vaultBalance = vaultBalance - amountRequested;
    vaultBalanceAvailable = vaultBalanceAvailable - amountRequested;
    payable(msg.sender).transfer(amountRequested);
  }
  
  function donateToHolders() public payable whenNotPaused {
    require(msg.value > 0, "Must donate positive amount");
    _handleRevenue(msg.value);
  }
  function _handleRevenue(uint256 amount) internal whenNotPaused {
      pricePerShare = pricePerShare + pricePerShare * amount / vaultBalance;
      vaultBalance = vaultBalance + amount;
  }
   function _handleLoss(uint256 amount) internal whenNotPaused {
      pricePerShare = pricePerShare - pricePerShare * amount / vaultBalance;
      vaultBalance = vaultBalance - amount;
  }
  // Admin functions ----
  function setCap(uint cap) public onlyOwner {
    vaultCap = cap;
  }
  function whitelistCollection(address collectionAddress, uint floorPrice, uint interestRatePercent, uint collateralizationRatio) public onlyOwner {
    if (collectionIsActive[collectionAddress] == false) {
      collectionIsActive[collectionAddress] = true;
      collections.push(collectionAddress);
    }
    collectionFloorPrice[collectionAddress] = floorPrice;
    collectionInterestRate[collectionAddress] = interestRatePercent;
    collectionCollateralizationRatio[collectionAddress] = collateralizationRatio;
  }
  function setCollectionFloorPrice(address collectionAddress, uint floorPrice) public onlyOwner {
    collectionFloorPrice[collectionAddress] = floorPrice;
  }
  function setCollectionInterestPercent(address collectionAddress, uint interestRatePercent) public onlyOwner {
    collectionInterestRate[collectionAddress] = interestRatePercent;
  }
  function setCollectionCollateralizationRatio(address collectionAddress, uint collateralizationRatio) public onlyOwner {
    collectionCollateralizationRatio[collectionAddress] = collateralizationRatio;
  }
  function suspendCollection(address collectionAddress) public onlyOwner {
    collectionIsActive[collectionAddress] = false;
  }
  function canForecloseOnToken(uint256 tokenId) public view returns (bool) {
    TNFT receiptContract = TNFT(receiptContractAddress);
    (address collectionAddress, uint token) = receiptContract.getNFTforTokenId(tokenId);
    address owner = receiptContract.ownerOf(tokenId);
    uint borrowedAmountAgainstCollection = borrowBalancesForCollection[owner][collectionAddress];
    uint portfolioValueForCollection = getPortfolioValueForAddressAndCollection(owner, collectionAddress);
    return portfolioValueForCollection < borrowedAmountAgainstCollection * foreclosureThresholdPercent / 100;
  }

  function foreclose(uint256 tokenId) payable public whenNotPaused {
    // TODO: Adjust price per share on foreclose
    TNFT receiptContract = TNFT(receiptContractAddress);
    (address collectionAddress, uint token) = receiptContract.getNFTforTokenId(tokenId);
    address owner = receiptContract.ownerOf(tokenId);
    uint borrowedAmountAgainstCollection = borrowBalancesForCollection[owner][collectionAddress];
    uint portfolioValueForCollection = getPortfolioValueForAddressAndCollection(owner, collectionAddress);
    require(portfolioValueForCollection < borrowedAmountAgainstCollection * foreclosureThresholdPercent / 100, "Token is not under collateralizaed");
    uint assetValue = getFloorValueForTokenInCollection(collectionAddress);
    require(msg.value >= assetValue - assetValue * foreclosureDicountPercent / 100, "Did not send enough ether");
    receiptContract.burn(tokenId);
    IERC721 nftContract = IERC721(collectionAddress);
    nftContract.safeTransferFrom(address(this), msg.sender, token);
    if (msg.value >= borrowBalancesForCollection[owner][collectionAddress]) {
      // Surplus foreclosure
        uint gain = msg.value - borrowBalancesForCollection[owner][collectionAddress];
        borrowBalancesForCollection[owner][collectionAddress] = 0;
        borrowBalances[msg.sender] = 0;
        _handleRevenue(gain);
    } else {
      // Loss foreclosure
        uint loss = borrowBalancesForCollection[owner][collectionAddress] - msg.value;
        borrowBalancesForCollection[owner][collectionAddress] -= msg.value;
        borrowBalances[msg.sender] -= msg.value;
        _handleLoss(loss);
    }
  }
  function setPricePerShare(uint256 price) public onlyOwner {
    pricePerShare = price;
  }
  function setAcceptingNewDeposits(bool accept) public onlyOwner {
    isAcceptingDeposits = accept;
  }
  function setVaultReservePercent(uint256 reservePercent) public onlyOwner {
    vaultReservePercent = reservePercent;
  }
  function setForeclosureThresholdPercent(uint256 threshold) public onlyOwner {
    foreclosureThresholdPercent = threshold;
  }


  // End admin functions ----

  // Getters -----
  function getWhitelistedCollections() public view returns (address[] memory) {
    return collections;
  }
  function getFloorValueForTokenInCollection(address collectionAddress) public view returns (uint256) {
    return collectionFloorPrice[collectionAddress];
  }
  function getBorrowingPowerForTokenInCollection(address collectionAddress) public view returns (uint256) {
    return collectionFloorPrice[collectionAddress] * collectionCollateralizationRatio[collectionAddress] / 100;
  }
  function getBorrowBalanceForAddressAndCollection(address _address, address collectionAddress) public view returns (uint256) {
    return borrowBalancesForCollection[_address][collectionAddress];
  }
    function getBorrowBalanceForAddress(address _address) public view returns (uint256) {
    return borrowBalances[_address];
  }
  function getInterestPercentForCollection(address collectionAddress) public view returns (uint256) {
    return collectionInterestRate[collectionAddress];
  }
  function getAllDepositors() public view returns (address[] memory) {
    return depositors;
  }
  function getDepositsForLender(address lender) public view returns (uint256) {
    return deposits[lender];
  }
  function getVaultCap() public view returns (uint256) {
    return vaultCap;
  }
  function getVaultBalance() public view returns (uint256) {
    return vaultBalance;
  }
  function getPricePerShare() public view returns (uint256) {
    return pricePerShare;
  }
  function getAmountAvailableToWithdraw(address addr) public view returns (uint256) {
    return balanceOf(addr) * pricePerShare / 1 ether;
  }
  // Modifiers -----

  modifier acceptingNewDeposits() {
    require(isAcceptingDeposits == true);
    _;
  }
  modifier collectionMustBeActive(address _address) {
    require(collectionIsActive[_address] == true);
    _;
  }
  // Override functions -----
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external override returns (bytes4) {
      return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }
}
