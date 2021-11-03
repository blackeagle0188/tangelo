const { ethers, deployer } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("New Tangelo Tests", function () {
  let tangelo;
  let owner, user, user2;

  describe("Tangelo", function () {
    it("Should deploy Sample NFT projects", async function () {
      const SampleNFT = await ethers.getContractFactory("SampleNFT");
      nftCollection = await SampleNFT.deploy();
      const SampleNFT2 = await ethers.getContractFactory("SampleNFT2");
      nftCollection2 = await SampleNFT2.deploy();
    });
    it("Should deploy Tangelo", async function () {
      const TNFT = await ethers.getContractFactory("TNFT");
      tnft = await TNFT.deploy();
      const Tangelo = await ethers.getContractFactory("Tangelo");
      tangelo = await Tangelo.deploy(tnft.address);
      tnft.setContractManager(tangelo.address);
      let accounts = await ethers.getSigners();
      owner = accounts[0];
      user = accounts[1];
      user2 = accounts[2];
    });

    describe("depositFunds()", function () {
        it("Should be able to deposit funds", async function () {
          const depositAmount = ethers.utils.parseEther("2");
          await tangelo.connect(user).depositFunds({value: depositAmount})
          expect(await tangelo.getVaultBalance()).to.equal(depositAmount);
          expect(await tangelo.balanceOf(user.address)).to.equal(depositAmount);
        });
        it("Should not exceed the cap", async function() {
          const depositAmount = ethers.utils.parseEther("500");
          await expect(tangelo.connect(user).depositFunds({value: depositAmount})).to.be.revertedWith("Vault cap exceeded");
        })
      });
  
      describe("withdrawFunds()", function () {
        it("Should not be able to withdraw too much", async function () {
          const withdrawAmount = ethers.utils.parseEther("3");
          await expect(tangelo.connect(user).withdrawFunds(withdrawAmount)).to.be.revertedWith('Not enough funds to withdraw');
        });
        it("Should be able to withdraw funds", async function () {
          const withdrawAmount = ethers.utils.parseEther("0.5");
          const remainingAmount = ethers.utils.parseEther("1.5");
          await tangelo.connect(user).withdrawFunds(withdrawAmount);
          expect(await tangelo.balanceOf(user.address)).to.equal(remainingAmount);
          expect(await tangelo.getVaultBalance()).to.equal(remainingAmount);
        });
        it("Should not be able to withdraw too much part 2", async function () {
          const withdrawAmount = ethers.utils.parseEther("1.6");
          await expect(tangelo.connect(user).withdrawFunds(withdrawAmount)).to.be.revertedWith('Not enough funds to withdraw');
        });
      });
  
      describe("whitelistCollection()", function () {
        let floorPrice = ethers.utils.parseEther("1.0");
        let interestAmount = 1000; // 10 percent interest
        let collateralizationFactor = 30;
        it("Only owner can whitelist an NFT collection", async function () {
          await expect(tangelo.connect(user).whitelistCollection(nftCollection.address, floorPrice, interestAmount, collateralizationFactor)).to.be.revertedWith('Ownable: caller is not the owner');
          const whitelist = await tangelo.getWhitelistedCollections();
          expect(whitelist).to.be.empty;
        });
        it("Owner can whitelist an NFT collection", async function () {
          await tangelo.whitelistCollection(nftCollection.address, floorPrice, interestAmount, collateralizationFactor);
          const whitelist = await tangelo.getWhitelistedCollections();
          const setFloorPrice = await tangelo.getFloorValueForTokenInCollection(nftCollection.address);
          const borrowingPower = await tangelo.getBorrowingPowerForTokenInCollection(nftCollection.address);
          const interestRate = await tangelo.getInterestPercentForCollection(nftCollection.address);
          expect(whitelist[0]).to.equal(nftCollection.address);
          expect(setFloorPrice).to.equal(floorPrice);
          expect(borrowingPower).to.equal(floorPrice.mul(collateralizationFactor).div(100));
          expect(interestRate).to.equal(interestAmount);
        });
      });

      describe("addCollateral()", function () {
          it("Can deposit an NFT as collateral", async function() {
              const tokenId = 1;
              await nftCollection.awardItem(user.address, tokenId);
              expect(await nftCollection.ownerOf(tokenId)).to.equal(user.address);
              await nftCollection.connect(user).setApprovalForAll(tangelo.address, true);
              const receiptNFT = (await tangelo.connect(user).addCollateral(nftCollection.address, tokenId));
              expect(await nftCollection.ownerOf(tokenId)).to.equal(tangelo.address);
              expect(await nftCollection.balanceOf(user.address)).to.equal(0);
              expect(await tnft.balanceOf(user.address)).to.equal(1);
              expect(await tnft.getCollectionToTokenCount(nftCollection.address)).to.equal(1);
              const [collection, token ] = await tnft.getNFTforTokenId(tokenId);
              expect(collection).to.equal(nftCollection.address);
              expect(token).to.equal(tokenId);
          })
      })

      describe("takeLoan()", function () {
        it("Can get asset value and borrowing power", async function() {
          const portfolioValue = await tangelo.getPortfolioValueForAddressAndCollection(user.address, nftCollection.address);
          const borriwingPower = await tangelo.getBorrowingPowerForAddressAndCollection(user.address, nftCollection.address);
          const borriwingPowerAccount = await tangelo.getBorrowingPowerForAddress(user.address);
          expect(portfolioValue).to.equal(ethers.utils.parseEther("1.0"));
          expect(borriwingPowerAccount).to.equal(ethers.utils.parseEther("0.3"));
          expect(borriwingPower).to.equal(ethers.utils.parseEther("0.3")); // borrow factor is 30% of the asset value
        })
        it("Cannot take too big of a loan", async function() {
            await expect(tangelo.takeLoan(ethers.utils.parseEther("0.301"), nftCollection.address)).to.be.revertedWith('Exceeds borrow limit');
        })
        it("Can take loan", async function() {
            expect(await tangelo.getBorrowingPowerForAddressAndCollection(user.address, nftCollection.address)).to.equal(ethers.utils.parseEther("0.3"));
            const balanceBeforeLoan = await user.getBalance();
            await tangelo.connect(user).takeLoan(ethers.utils.parseEther("0.3"), nftCollection.address);
            let balanceChange = await user.getBalance() - balanceBeforeLoan;
            expect(balanceChange).to.be.greaterThan(parseInt(ethers.utils.parseEther("0.29"))); // Slightly more than 0.29, gas fees
            expect(balanceChange).to.be.lessThan(parseInt(ethers.utils.parseEther("0.31"))); // Slightly less than 0.31, gas fees
            expect(await tangelo.getBorrowingPowerForAddressAndCollection(user.address, nftCollection.address)).to.equal(ethers.utils.parseEther("0"));

        })
        })

        describe("removeCollateral() cannot work if in use for loan", function () {
            it("Cannot remove an NFT from collateral during loan", async function() {
                const tokenId = 1;
                const borriwingPowerAccount = await tangelo.getBorrowingPowerForAddress(user.address);
                const borrowingPower = await tangelo.getBorrowingPowerForTokenInCollection(nftCollection.address);
                expect(await nftCollection.ownerOf(tokenId)).to.equal(tangelo.address);
                await expect(tangelo.connect(user).removeCollateral(tokenId)).to.be.revertedWith('Cannot remove collateral while in use for loan');
            })
        })
      describe("accrueInterest()", function () {
        it("Can accrue interest", async function() {
            const pricePerShareBeforeInterest = await tangelo.getPricePerShare();
            await ethers.provider.send("evm_increaseTime", [60*60*24*365]); // 1 year
            await tangelo.accrueInterest(); // Interest rate was set to 10%
            const pricePerShareAfterInterest = await tangelo.getPricePerShare();
            expect(await tangelo.getBorrowBalanceForAddressAndCollection(user.address, nftCollection.address)).to.equal(ethers.utils.parseEther("0.33"));
            const sharePriceIncrease = pricePerShareAfterInterest - pricePerShareBeforeInterest;
            const expectedIncrease = ethers.utils.parseEther("0.03").div(2); // 2 shares outstanding
            expect(sharePriceIncrease).to.be.greaterThan(expectedIncrease); // Slightly more than 0.29, gas fees
        })
      })
      describe("repayLoan()", function () {
        it("Cannot overpay", async function () {
            await expect(tangelo.connect(user).repayLoan(nftCollection.address, {value: ethers.utils.parseEther("0.4")})).to.be.revertedWith('Send less than your borrow balance');
        })
          it("Can repay loan", async function () {
              expect(await tangelo.getBorrowBalanceForAddressAndCollection(user.address, nftCollection.address)).to.equal(ethers.utils.parseEther("0.3"));
              await tangelo.connect(user).repayLoan(nftCollection.address, {value: ethers.utils.parseEther("0.3")});
              expect(await tangelo.getBorrowBalanceForAddressAndCollection(user.address, nftCollection.address)).to.equal(ethers.utils.parseEther("0"));
          })
      })
      describe("removeCollateral()", function () {
        it("Can remove an NFT from collateral", async function() {
            const tokenId = 1;
            expect(await nftCollection.ownerOf(tokenId)).to.equal(tangelo.address);
            await tangelo.connect(user).removeCollateral(tokenId);
            expect(await nftCollection.ownerOf(tokenId)).to.equal(user.address);
            expect(await nftCollection.balanceOf(user.address)).to.equal(1);
            expect(await tnft.balanceOf(user.address)).to.equal(0);
            expect(await tnft.getCollectionToTokenCount(nftCollection.address)).to.equal(0);
        })
    })

    describe("takeLoan() no collateral", function () {
        it("Cant take loan after returning collateral", async function() {
        await expect(tangelo.takeLoan(ethers.utils.parseEther("0.01"), nftCollection.address)).to.be.revertedWith('Exceeds borrow limit');
        })
    })

    describe("foreclose()", function () {
        const tokenReceiptId = 3;
        it("takes loan then asset price drops", async function() {
            const tokenId = 1;
            await tangelo.connect(user).addCollateral(nftCollection.address, tokenId);
            await tangelo.connect(user).takeLoan(ethers.utils.parseEther("0.3"), nftCollection.address);
            await tangelo.connect(owner).setCollectionFloorPrice(nftCollection.address, ethers.utils.parseEther("0.5"));
        })
        it("cannot foreclose on solvent asset", async function() {
            expect(await tangelo.canForecloseOnToken(tokenReceiptId)).to.equal(false);
            const amountToSend = ethers.utils.parseEther("50");
            await expect(tangelo.foreclose(tokenReceiptId, {value: amountToSend})).to.be.revertedWith('Token is not under collateralizaed');
        })
        it('price drops more making asset foreclosable', async function() {
            await tangelo.connect(owner).setCollectionFloorPrice(nftCollection.address, ethers.utils.parseEther("0.4"));
            expect(await tangelo.canForecloseOnToken(tokenReceiptId)).to.equal(true);
        })
        it("cannot foreclose on insolvent asset if not enough sent", async function() {
            const amountToSend = ethers.utils.parseEther("0.3");
            await expect(tangelo.foreclose(tokenReceiptId, {value: amountToSend})).to.be.revertedWith('Did not send enough ether');
        })
        it("can foreclose on an insolvent asset", async function() {
            const amountToSend = ethers.utils.parseEther("0.36");
            expect(await tnft.balanceOf(user.address)).to.equal(1);
            expect(await nftCollection.balanceOf(user2.address)).to.equal(0);
            await tangelo.connect(user2).foreclose(tokenReceiptId, {value: amountToSend})
            expect(await tnft.balanceOf(user.address)).to.equal(0);
            expect(await nftCollection.balanceOf(user2.address)).to.equal(1);
            
        })
    })


  });
});