import React, { useEffect, useState } from "react";
import { Layout, Button, Typography } from "antd";
const { ethers } = require("ethers");

const { Content } = Layout;
const { Text } = Typography;

export default function Borrow({
  nft,
  image,
  name,
  tokenID,
  contract,
  address,
  statusNotification,
  handleApprove,
  days,
}) {
  const [amount, setAmount] = useState(0)
  const [borrowing, setBorrowing] = useState(false)
  useEffect(() => {
    handleGetAmount()
  });

  const handleGetAmount = async () => {
    let eth_amount = await contract["Tangelo"]["getBorrowingPowerForTokenInCollection"](address);    
    let roundedAmount = ethers.utils.formatEther(eth_amount["_hex"]);
    setAmount(roundedAmount);
  }

  const handleCheckApprove = async () => {
    setBorrowing(true)
    try {
      let approve = await nft["getApproved"](tokenID);
      if(approve != contract["Tangelo"]["address"]) {
        const res = await handleApprove(address, contract["Tangelo"]["address"], tokenID)
        const result = await res.wait()
        if(result["status"] == 1) {
          handleTakeLoan()
        }
      } else {
        handleTakeLoan()
      }
    } catch(e) {
      setBorrowing(false)
    }
  }
  const handleTakeLoan = async () => {
    try {
      const hash = await contract["Tangelo"]["addCollateral"](address, tokenID)
      statusNotification("info", "Transaction in progress", hash["hash"])
      const result = await hash.wait();
      if(result["status"] == 1) {
        statusNotification("success", "NFT deposited", hash["hash"])
      } else {
        statusNotification("error", "Failed deposit", "")
      }
      setBorrowing(false)
    } catch(e) {
      setBorrowing(false)
    }
  }

  return (
    <Layout className="borrow_card">
      <img src={image} alt="card" />
      <Content className="card_details">
        <Text className="righteous collection details">
          {name}
        </Text>
        <Text className="borrow_eth righteous">
          {amount} ETH
        </Text>
        <Button className="btn_borrow btn dark righteous white-text" onClick={handleCheckApprove} disabled={borrowing}>
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
              <span>deposit</span>
          )}
        </Button>
      </Content>
    </Layout>
  );
}
