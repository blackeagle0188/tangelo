import { Button, Typography, Layout, Progress } from "antd";
import "antd/dist/antd.css";
import "graphiql/graphiql.min.css";
import React, { useState, useEffect } from "react";
import NumericInput from "react-numeric-input";
import { Tabs } from "../components";

const { Content } = Layout;
const { Text } = Typography;

function myFormat(num) {
  if (num === "") {
    return "";
  }
  return num + " ETH";
}

function Lending(props) {
  const [depositAmount, setDepositAmount] = useState();
  const [withdrawAmount, setWithdrawAmount] = useState();

  const handleDepositAmount = (e) => {
    setDepositAmount(e)
  }

  const handleWithdrawAmount = (e) => {
    setWithdrawAmount(e)
  }

  const handleDeposit = () => {
    if(depositAmount == 0 || depositAmount == undefined) {return}
    props.depositEther(depositAmount)
    setDepositAmount()
  }

  const handleWithdraw = () => {
    if(withdrawAmount == 0 || withdrawAmount == undefined) {return}
    props.withdrawEther(withdrawAmount)
    setWithdrawAmount()
  }

  const [percent, setPercent] = useState(0)

  useEffect(() => { 
    setPercent((props.vault / props.vaultCap) * 100)
  }, [props.vault, props.vaultCap]);

  return (
    <Layout className="main_layout lending black-background">
      <Text className="lending_text righteous">earn yield by lending ETH</Text>
      <Content className="content_deposit">
        <Content className="content_element">
          <Tabs>
            <div label="Deposit">
              <Text className="deposit_title righteous">approx 30% APY</Text>
              <Content className="ether_amount">
                <Content className="amount">
                  <Text className="righteous amount_low">{props.vault} ETH</Text>
                  <Text className="righteous amount_high">{props.vaultCap} ETH cap</Text>
                </Content>
                <Progress percent={percent} size="small" style={{width: "100%"}} showInfo={false} trailColor={"#FFF3C2"} strokeColor={"#F78B0D"} className="ether_value" />
              </Content>
              <NumericInput min={0} format={myFormat} className="btn_ether white-light righteous" placeholder="amount in ETH" onChange={handleDepositAmount.bind(this)} value={depositAmount}/>
              <Button className="btn_deposit btn light-dark righteous" style={{width: "100%"}} onClick={handleDeposit} disabled={props.borrowing}>
                { props.borrowing ? (
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
            </div>
            <div label="Withdraw">
              <Text className="deposit_title righteous">your position: {props.availableWithdraw} ETH</Text>
              <Content className="ether_amount">
                <Content className="amount">
                  <Text className="righteous amount_low">{props.vault} ETH</Text>
                  <Text className="righteous amount_high">{props.vaultCap} ETH cap</Text>
                </Content>
                <Progress percent={percent} size="small" style={{width: "100%"}} showInfo={false} trailColor={"#FFF3C2"} strokeColor={"#F78B0D"} className="ether_value" />
              </Content>
              <NumericInput min={0} format={myFormat} className="btn_ether white-light righteous" placeholder="amount in ETH" onChange={handleWithdrawAmount.bind(this)} value={withdrawAmount}/>
              <Button className="btn_deposit btn light-dark righteous" style={{width: "100%"}} onClick={handleWithdraw} disabled={props.borrowing}>
              { props.borrowing ? (
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
            </div>
          </Tabs>
        </Content>
      </Content>
      <Content className="content_strategy">
        <Text className="righteous strategy_title white-text">strategy</Text>
        <Text className="righteous strategy_content white-text">you earn yield by betting that NFT prices will not crash by more than 50% in a given week. Loans are diversiifed accross reputable collections like cryptopunks, bored apes, and meebits. In the interest of stability, NFT collections are whitelisted slowly onto the platform after reliable demand is proven.</Text>
      </Content>
    </Layout>
  );
}

export default Lending;
