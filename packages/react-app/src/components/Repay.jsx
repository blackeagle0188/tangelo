import React, { useEffect, useState } from "react";
import { Layout, Button, Typography } from "antd";
import NFT from "../contracts/NFT.json"
import isURL from 'validator/lib/isURL';
import { CORS_ENDPOINT } from "../constants";
const { ethers } = require("ethers");
const axios = require('axios');

const { Content } = Layout;
const { Text } = Typography;

export default function Repay({
  tokenID,
  contract,
  statusNotification,
  provider
}) {
  const [collection, setCollection] = useState()
  const [name, setName] = useState("")
  const [image, setImage] = useState("/no_image.png")
  const [amount, setAmount] = useState(0)
  const [loadNFt, setLoadNft] = useState(false)
  const [borrowing, setBorrowing] = useState(false)

  useEffect(() => {
    if(!loadNFt) {
      handleGetCollection()
      setLoadNft(true)
    }
  });

  useEffect(() => {
    if(collection != undefined) {
      handleGetAmount()
    }
  }, [collection]);

  const handleGetCollection = async () => {
    let nft = await contract["TNFT"]["getNFTforTokenId"](tokenID);
    setCollection(nft)
    let nftContract = await new ethers.Contract(nft[0], NFT, provider)
    let tokenUri = await nftContract.tokenURI(nft[1])
    let nftName = await nftContract.name()
    setName(nftName + " #" + parseInt(nft[1]))
    let image = "/no_image.png";
    if(isURL(tokenUri)) {
      const meta = await axios.get(CORS_ENDPOINT+ tokenUri)
      image =  meta.data.image
      if(image != undefined && image.includes("ipfs://")) {
        image = image.replace("ipfs://", "https://ipfs.io/ipfs/")
      }
    } else {
      if(tokenUri.includes("ipfs://")) {
        tokenUri = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
        const meta = await axios.get(CORS_ENDPOINT + tokenUri)
        image =  meta.data.image
        if(image != undefined && image.includes("ipfs://")) {
          image = image.replace("ipfs://", "https://ipfs.io/ipfs/")
        }
      }
    }
    setImage(image)
  }

  const handleGetAmount = async () => {
    let eth_amount = await contract["Tangelo"]["getBorrowingPowerForTokenInCollection"](collection[0]);    
    let roundedAmount = ethers.utils.formatEther(eth_amount["_hex"]);
    setAmount(roundedAmount);
  }

  const handleRepay = async () => {
    setBorrowing(true)
    try {
      const hash = await contract["Tangelo"]["removeCollateral"](tokenID);
      statusNotification("info", "Transaction in progress", hash["hash"])
      const result = await hash.wait();
      if(result["status"] == 1) {
        statusNotification("success", "Loan withdrew", hash["hash"])
      } else {
        statusNotification("error", "Failed withdraw", "")
      }
      setBorrowing(false)
    } catch (e) {
      setBorrowing(false)
      if(e["error"] && e["error"]["message"]) {
        const strMsg = e["error"]["message"];
        statusNotification("error", strMsg.replace("execution reverted", "").replace(":", ""), "")
      } else {
        statusNotification("error", "Failed", "")
      }
    }
  }

  return (
    <Layout className="borrow_card repay">
      <img src={image} alt="card"/>
      <Content className="card_details">
        <Text className="righteous collection details">
          {name}
        </Text>
        <Text className="borrow_eth righteous">
          {amount} ETH
        </Text>
        <Button className="btn_borrow btn blue righteous white-text" onClick={handleRepay} disabled={borrowing}>
          { borrowing ? (
            <div className="borrow-loading-container">
              <div className="borrow-loader">
                <div className="borrow-loading-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
            </div>
          )
          :
          (
              <span>withdraw</span>
          )}
        </Button>
      </Content> 
    </Layout>
  );
}
