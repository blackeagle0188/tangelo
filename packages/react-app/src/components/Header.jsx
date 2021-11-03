import { PageHeader } from "antd";
import { Account } from "../components";
import React from "react";

// displays a page header

export default function Header({
  address,
  localProvider,
  userSigner,
  mainnetProvider,
  price,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer
}) {
  
  return (
      <PageHeader  
        style={{ display: "flex", paddingLeft: "0", paddingRight: "0" }}>
        <a href="/" rel="noopener noreferrer">
          <img src="/logo.png" alt="logo" />
        </a>
        <div className="account_info">
          <Account
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </div>
      </PageHeader>
  );
}
