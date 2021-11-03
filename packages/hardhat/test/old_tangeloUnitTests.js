// const { ethers } = require("hardhat");
// const { use, expect } = require("chai");
// const { solidity } = require("ethereum-waffle");

// use(solidity);

// describe("Tangelo Unit Tests", function () {
//   let tangelo;
//   let owner, user, foreclosureAddress;

//   describe("Tangelo", function () {
//     it("Should deploy Sample NFT projects", async function () {
//       const SampleNFT = await ethers.getContractFactory("SampleNFT");
//       nftCollection = await SampleNFT.deploy();
//       const SampleNFT2 = await ethers.getContractFactory("SampleNFT2");
//       nftCollection2 = await SampleNFT2.deploy();
//     });
//     it("Should deploy Tangelo", async function () {
//       const Tangelo = await ethers.getContractFactory("Tangelo");
//       tangelo = await Tangelo.deploy();
//       let accounts = await ethers.getSigners();
//       owner = accounts[0];
//       user = accounts[1];
//       foreclosureAddress = accounts[2];
//     });

    // describe("depositFunds()", function () {
    //   it("Should be able to deposit funds", async function () {
    //     const depositAmount = ethers.utils.parseEther("2");
    //     await tangelo.connect(user).depositFunds({value: depositAmount})
    //     expect(await tangelo.getVaultBalance()).to.equal(depositAmount);
    //     expect(await tangelo.balanceOf(user.address)).to.equal(depositAmount);
    //   });
    //   it("Should not exceed the cap", async function() {
    //     const depositAmount = ethers.utils.parseEther("500");
    //     await expect(tangelo.connect(user).depositFunds({value: depositAmount})).to.be.revertedWith("Vault cap exceeded");
    //   })
    // });

    // describe("withdrawFunds()", function () {
    //   it("Should not be able to withdraw too much", async function () {
    //     const withdrawAmount = ethers.utils.parseEther("3");
    //     await expect(tangelo.connect(user).withdrawFunds(withdrawAmount)).to.be.revertedWith('Not enough funds to withdraw');
    //   });
    //   it("Should be able to withdraw funds", async function () {
    //     const withdrawAmount = ethers.utils.parseEther("0.5");
    //     const remainingAmount = ethers.utils.parseEther("1.5");
    //     await tangelo.connect(user).withdrawFunds(withdrawAmount);
    //     expect(await tangelo.balanceOf(user.address)).to.equal(remainingAmount);
    //     expect(await tangelo.getVaultBalance()).to.equal(remainingAmount);
    //   });
    //   it("Should not be able to withdraw too much part 2", async function () {
    //     const withdrawAmount = ethers.utils.parseEther("1.6");
    //     await expect(tangelo.connect(user).withdrawFunds(withdrawAmount)).to.be.revertedWith('Not enough funds to withdraw');
    //   });
    // });

    // describe("whitelistCollection()", function () {
    //   let loanAmount = ethers.utils.parseEther("1.0");
    //   let interestAmount = 1000; // 10 percent interest
    //   it("Only owner can whitelist an NFT collection", async function () {
    //     await expect(tangelo.connect(user).whitelistCollection(nftCollection.address, loanAmount, interestAmount)).to.be.revertedWith('Ownable: caller is not the owner');
    //     const whitelist = await tangelo.getWhitelistedCollections();
    //     expect(whitelist).to.be.empty;
    //   });
    //   it("Owner can whitelist an NFT collection", async function () {

    //     await tangelo.whitelistCollection(nftCollection.address, loanAmount, interestAmount);
    //     const whitelist = await tangelo.getWhitelistedCollections();
    //     const lendingPrice = await tangelo.getLoanAmountForCollection(nftCollection.address);
    //     const interestRate = await tangelo.getInterestRateForCollection(nftCollection.address);
    //     expect(whitelist[0]).to.equal(nftCollection.address);
    //     expect(lendingPrice).to.equal(loanAmount);
    //     expect(interestRate).to.equal(interestAmount);
    //   });
    // });


    // describe("takeLoan()", function () {
    //   it("Should be able to deposit a SampleNFT for a loan", async function () {
    //     const tokenId = 1;
    //     let userBalance = ethers.utils.formatEther(await user.getBalance());
    //     await nftCollection.awardItem(user.address, tokenId);
    //     await nftCollection.connect(user).setApprovalForAll(tangelo.address, true);
    //     await tangelo.connect(user).takeLoan(nftCollection.address, tokenId);
    //     expect(await nftCollection.ownerOf(tokenId)).to.equal(tangelo.address);
    //     expect(await tangelo.connect(user).getOwnerForLockedNFT(nftCollection.address, tokenId)).to.equal(user.address);
    //     expect(await tangelo.getLoanAmountForLockedNFT(nftCollection.address, tokenId)).to.equal(ethers.utils.parseEther("1.00"));
    //     expect(await tangelo.getLoanInterestAmountForLockedNFT(nftCollection.address, tokenId)).to.equal(ethers.utils.parseEther("0.10"));
    //     const loanDueDateActual = await tangelo.getLoanDueDateforLockedNFT(nftCollection.address, tokenId)
    //     let loanDueDateExpected = parseInt((Date.now() / 1000) + 60*60*24*7); // 7 days from now
    //     let difference = Math.abs(loanDueDateExpected - loanDueDateActual);
    //     expect(difference).to.be.lessThan(60); // Difference should be less than 60 secs
    //     let userBalanceAfterLoan = ethers.utils.formatEther(await user.getBalance());
    //     let balanceIncrease = userBalanceAfterLoan - userBalance;
    //     expect(Math.round(balanceIncrease, 2)).to.equal(1);
    //   });

    //   it("Cannot take a loan for more than the vault has", async function () {
    //     // Vault should be empty after above loan
    //     const tokenId = 2;
    //     await nftCollection.awardItem(user.address, tokenId);
    //     await expect(tangelo.connect(user).takeLoan(nftCollection.address, tokenId)).to.be.revertedWith("Not enough funds in vault to cover this loan");
    //   });

    //   it("Should not be able to deposit same NFT twice", async function() {
    //     const tokenId = 3;
    //     await nftCollection.awardItem(user.address, tokenId);
    //     await nftCollection.connect(user).setApprovalForAll(tangelo.address, true);
    //     const depositAmount = ethers.utils.parseEther("5");
    //     await tangelo.connect(user).depositFunds({value: depositAmount})
    //     await tangelo.connect(user).takeLoan(nftCollection.address, tokenId);
    //     await expect(tangelo.connect(user).takeLoan(nftCollection.address, tokenId)).to.be.revertedWith('ERC721: transfer of token that is not own');
    //   })


//       it("Cannot take loan against non whitelist NFT", async function () {
//         const tokenId = 1;
//         await nftCollection2.awardItem(user.address, tokenId);
//         await nftCollection2.connect(user).setApprovalForAll(tangelo.address, true);
//         await expect(tangelo.connect(user).takeLoan(nftCollection2.address, tokenId)).to.be.revertedWith('NFT collection not supported yet');
//       });
//     });

//     describe("repayLoanForNFT()", function () {
//       it("Should not be able to underpay", async function () {
//         let repaymentAmount = ethers.utils.parseEther("1.09");
//         await expect(tangelo.connect(user).repayLoanForNFT(nftCollection.address, 1, {value: repaymentAmount})).to.be.revertedWith('Send the correct amount');
//       })
//       it("Should not be able to overpay", async function () {
//         let repaymentAmount = ethers.utils.parseEther("1.11");
//         await expect(tangelo.connect(user).repayLoanForNFT(nftCollection.address, 1, {value: repaymentAmount})).to.be.revertedWith('Send the correct amount');
//       })
//       it("Should be able to repay a loan", async function () {
//         let repaymentAmount = ethers.utils.parseEther("1.10");
//         await tangelo.connect(user).repayLoanForNFT(nftCollection.address, 1, {value: repaymentAmount});
//         expect(await nftCollection.ownerOf(1)).to.equal(user.address); // Gets NFT back
//       })
//     })
//     describe("payoutVaultRevenue()", function () {
//       it("Should not be able to payout to non-owner", async function () {
//         await expect(tangelo.connect(user).payoutVaultRevenue(user.address)).to.be.revertedWith('Ownable: caller is not the owner');
//       })
//       it("Should be able to payout to owner", async function () {
//         const expectedPayout = ethers.utils.parseEther("0.1").mul(2).div(100);
//         expect(await tangelo.connect(owner).getVaultRevenue()).to.equal(expectedPayout);
//         await tangelo.connect(owner).payoutVaultRevenue(user.address);
//         expect(await tangelo.getVaultRevenue()).to.equal(ethers.utils.parseEther("0.00"));
//       })
//     })
//     describe("foreclose()", async function () {
//       it("Should not be able to foreclose a loan early", async function () {
//         await  tangelo.connect(owner).setForeclosureContract(foreclosureAddress.address);
//         const add = await tangelo.getForeclosureContract();
//         await tangelo.connect(user).takeLoan(nftCollection.address, 1);
//         await expect(tangelo.connect(owner).foreclose(nftCollection.address, 1)).to.be.revertedWith('Cannot foreclose yet');
//         await expect(tangelo.connect(owner).foreclose(nftCollection.address, 1)).to.be.revertedWith('Cannot foreclose yet');
//         await ethers.provider.send("evm_increaseTime", [60*60*24*6 + 60*60*23 + 60*59]); // 6 days + 23 hours + 59 minutes, cant foreclose
//         await expect(tangelo.connect(owner).foreclose(nftCollection.address, 1)).to.be.revertedWith('Cannot foreclose yet');
//       })
//       it("Non owner cannot foreclose loan", async function () {
//         await expect(tangelo.connect(user).foreclose(nftCollection.address, 1)).to.be.revertedWith('Ownable: caller is not the owner');
//       })
//       it("Should be able to foreclose a loan after one week", async function () {
//         await ethers.provider.send("evm_increaseTime", [60]); // 1 minute later, can foreclose
//         const balanceBeforeForeclosure = await tangelo.getVaultBalance();
//         const sharePriceBeforeForeclosure = await tangelo.getPricePerShare();
//         await tangelo.connect(owner).foreclose(nftCollection.address, 1);
//         const balanceAfterForeclosure = await tangelo.getVaultBalance();
//         const lostValue = parseInt(ethers.utils.parseEther("1")) / parseInt(balanceBeforeForeclosure); // vault loses 1/x on foreclosure
//         const expectedNewSharePrice = sharePriceBeforeForeclosure - (lostValue * sharePriceBeforeForeclosure);
//         expect(balanceBeforeForeclosure - balanceAfterForeclosure).to.equal(parseInt(ethers.utils.parseEther("1.00")));
//         expect(parseInt(await tangelo.getPricePerShare())).to.equal(parseInt(expectedNewSharePrice));
//       })
//     });

//   });
// });
