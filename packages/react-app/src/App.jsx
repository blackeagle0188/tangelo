import WalletConnectProvider from "@walletconnect/web3-provider";
import NFT from "./contracts/NFT.json"
import WalletLink from "walletlink";
import { Alert, Button, Menu, Layout, Typography, notification, Progress, Dropdown  } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Header, Borrow, Repay, WhitelistRequest, Tabs } from "./components";
import { INFURA_ID, NETWORK, NETWORKS, ETHERSCAN_KEY, API_ENDPOINT, CORS_ENDPOINT } from "./constants";
import { Transactor } from "./helpers";
import isURL from 'validator/lib/isURL';
import NumericInput from 'react-numeric-input';
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "./hooks";
import { Lending } from "./views";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";

const { ethers } = require("ethers");
const { Content } = Layout;
const { Text } = Typography;
const axios = require('axios');
const symbol = "Tangelo NFT"
const non_token = "0x0000000000000000000000000000000000000000"
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.ropsten; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;

let etherscanNetwork = "";
if (targetNetwork.name && targetNetwork.chainId > 1) {
  etherscanNetwork = targetNetwork.name + ".";
}
const etherscanTxUrl = "https://" + etherscanNetwork + "etherscan.io/tx/";

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I )

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

function App(props) {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(injectedProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
                .
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);
  
  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const modalButtons = [];
  if (web3Modal) {
    if (web3Modal.cachedProvider) {

    } else {
      modalButtons.push(
        <Button
          key="loginbutton"
          style={{ verticalAlign: "top", border: "none" }}
          /* type={minimized ? "default" : "primary"}     too many people just defaulting to MM and having a bad time */
          onClick={loadWeb3Modal}
          className="connect_status dark"
        >
        connect wallet
        </Button>,
      );
    }
  }
  
  const [powerPercent, SetPowerPercent] = useState(0)

  const objBorrowBalance = useContractReader(readContracts, "Tangelo", "getBorrowBalanceForAddress", [address]);
  const [borrowBalance, setBorrowBalance] = useState(0)

  useEffect(() => {
    if(objBorrowBalance != undefined) {
      setBorrowBalance(parseFloat(parseFloat(ethers.utils.formatEther(objBorrowBalance["_hex"])).toFixed(4)))
    } else {
      setBorrowBalance(0)
    }
  }, [objBorrowBalance]);

  const objBorrowPower = useContractReader(readContracts, "Tangelo", "getBorrowingPowerForAddress", [address]);
  const [borrowPower, setBorrowPower] = useState(0)

  useEffect(() => {
    if(objBorrowPower != undefined) {
      setBorrowPower(parseFloat(parseFloat(ethers.utils.formatEther(objBorrowPower["_hex"])).toFixed(4)))
    } else {
      setBorrowPower(0)
    }
  }, [objBorrowPower]);

  useEffect(() => {
    if(borrowBalance != undefined && borrowPower != undefined) {
      if(borrowPower == 0) {
        SetPowerPercent(0)
      } else {
        SetPowerPercent(parseFloat(parseFloat((borrowBalance / borrowPower) * 100).toFixed(2)))
      }
    }
  }, [borrowBalance, borrowPower]);

  const objVaultAmount = useContractReader(readContracts, "Tangelo", "getVaultBalance");
  const [vaultAmount, setVaultAmount] = useState(0)

  useEffect(() => {
    if(objVaultAmount != undefined) {
      setVaultAmount(parseFloat(parseFloat(ethers.utils.formatEther(objVaultAmount["_hex"])).toFixed(4)))
    } else {
      setVaultAmount(0)
    }
  }, [objVaultAmount]);

  const objVaultCap = useContractReader(readContracts, "Tangelo", "getVaultCap");
  const [vaultCap, setVaultCap] = useState(0)

  useEffect(() => {
    if(objVaultCap != undefined) {
      setVaultCap(parseInt(ethers.utils.formatEther(objVaultCap["_hex"])))
    }
  }, [objVaultCap]);

  const objAvailableWithdraw = useContractReader(readContracts, "Tangelo", "getAmountAvailableToWithdraw", [address]);
  const [availableWithdraw, setAvailableWithdraw] = useState(0)

  useEffect(() => {
    if(objAvailableWithdraw != undefined) {
      setAvailableWithdraw(parseFloat(parseFloat(ethers.utils.formatEther(objAvailableWithdraw["_hex"])).toFixed(4)))
    }
  }, [objAvailableWithdraw]);

  const contractFunction = async (param) => {
    return await readContracts["Tangelo"][param["functionName"]](...param["data"])
  }

  const depositEther = (amount) => {
    handleDeposit(amount)
  }

  const handleDeposit = async (amount) => {
    const bigValue = ethers.utils.parseUnits(amount.toString())
    setEthDeposit(true)
    try {
      const param = [{data : [{value: bigValue}], functionName: "depositFunds"}]
      const hash = await contractFunction(param[0])
      statusNotification("info", "Transaction in progress", hash["hash"])
      const result = await hash.wait();
      if(result["status"] == 1) {
        statusNotification("info", "Deposited " + amount + " ETH", hash["hash"])
      } else {
        statusNotification("info", "Failed deposit", "")
      }
      setEthDeposit(false)
    } catch(e) {
      setEthDeposit(false)
      if(e["error"] && e["error"]["message"]) {
        const strMsg = e["error"]["message"];
        statusNotification("error", strMsg.replace("execution reverted", "").replace(":", ""), "")
      } else {
        statusNotification("error", "Failed", "")
      }
    }
  }

  const withdrawEther = (amount) => {
    handleWithdraw(amount)
  }

  const handleWithdraw = async (amount) => {
    const bigValue = ethers.utils.parseUnits(amount.toString())
    setEthDeposit(true)
    try {
      const param = [{data : [bigValue["_hex"]], functionName: "withdrawFunds"}]
      const hash = await contractFunction(param[0])
      statusNotification("info", "Transaction in progress", hash["hash"])
      const result = await hash.wait();
      if(result["status"] == 1) {
        statusNotification("success", "Withdrew " + amount + " ETH", hash["hash"])
      } else {
        statusNotification("info", "Failed withdraw", "")
      }
      setEthDeposit(false)
    } catch(e) {
      setEthDeposit(false)
      if(e["error"] && e["error"]["message"]) {
        const strMsg = e["error"]["message"];
        statusNotification("error", strMsg.replace("execution reverted", "").replace(":", ""), "")
      } else {
        statusNotification("error", "Failed", "")
      }
    }
  }

  const statusNotification = (type, message, hash) => {
    let description = "";
    if(hash != "") {
      description = <Button onClick={() => {
        window.open(etherscanTxUrl + hash);
      }}>
        View on etherscan
      </Button>
    }
    notification[type]({
      message: message != "" ? message : "Failed",
      description: description,
      placement: "topRight",
    });
  }

  const [nfts, setNfts] = useState([])
  const [availableNfts, setAvailableNfts] = useState([])
  const [repayNfts, setRepayNfts] = useState([])
  const [requestNfts, setRequestNfts] = useState([])
  const [borrowNfts, setBorrowNfts] = useState([])
  const [tangeloNfts, setTangeloNfts] = useState([])
  const [loadingNfts, setLoadingNfts] = useState(true)

  const [tokenList ,setTokenList] = useState()

  useEffect(() => {
    const interval = setInterval(() => {
      if(address != undefined) {
        handleNFTList()
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [address]);

  const handleNFTList = () => {
    fetch(API_ENDPOINT + "?module=account&action=tokennfttx&address="+address+"&startblock=0&endblock=999999999&sort=desc&apikey="+ETHERSCAN_KEY,{
      "method": "GET",
      "headers": {
        "content-type": "application/json",
      }
  })
      .then(res => res.json())
      .then(
        (result) => {
          if(result["status"] == 0) {

          } else {
           let pp = result["result"].filter( (ele, ind) => ind === result["result"].findIndex( elem => elem.contractAddress === ele.contractAddress && elem.tokenID === ele.tokenID))
           pp = pp.filter(item => item.to != non_token)
            setTokenList(pp)
          }
        },
        (error) => {
          console.log(error)
        }
      )
  }

  const purpose = useContractReader(readContracts, "Tangelo", "getWhitelistedCollections");

  useEffect(() => {
    if(purpose != undefined) {
      loadNFTs()
    }
  }, [injectedProvider, tokenList, purpose])

  async function loadNFTs() {
    if(injectedProvider != undefined && tokenList != undefined) {
      let items = await Promise.all(tokenList.map(async i => {
        try {
          let tokenUri = await new ethers.Contract(i.contractAddress, NFT, injectedProvider).tokenURI(i.tokenID)
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
          
          let item = {
            contract: new ethers.Contract(i.contractAddress, NFT, injectedProvider),
            tokenId: i.tokenID,
            image: image,
            name: i.tokenName + " #" + i.tokenID,
            address: i.to,
            tokenAddress: i.contractAddress,
            collectionName: i.tokenName,
          }
          return item
        } catch (e) {
          return undefined;
        }
       }))
       items = items.filter(item => item != undefined)
       let filter_items = items
       let other_items = filter_items.filter(item => item.collectionName == symbol)
       other_items = other_items.filter(item => item.tokenAddress.toUpperCase() == readContracts["TNFT"]["address"].toUpperCase())
       setTangeloNfts(other_items)
       filter_items = filter_items.filter(item => item.collectionName != symbol)
       setNfts(filter_items)
       filter_items = filter_items.filter(item => parseInt(item.address, 16).toString(16) == parseInt(address, 16).toString(16))
       let loadItems = filter_items.filter (item => handleCheck(item.tokenAddress))
       let requestItems = filter_items.filter (item => handleCheck(item.tokenAddress) == false)
       let repayItems = filter_items.filter(item => parseInt(item.address, 16).toString(16) != parseInt(address, 16).toString(16))
       repayItems = items.filter(item => parseInt(item.address, 16).toString(16) == parseInt(readContracts["Tangelo"]["address"], 16).toString(16))
       setAvailableNfts(loadItems)
       setRequestNfts(requestItems)
       setRepayNfts(repayItems)
       let borrowItems = repayItems.filter( (ele, ind) => ind === repayItems.findIndex( elem => elem.tokenAddress === ele.tokenAddress))
       if(borrowItems.length > 0) {
        setBorrowNfts(borrowItems)
        if(selectedCollection == undefined) {
         setSelectedCollection(borrowItems[0])
         let param = [{data : [borrowItems[0].tokenAddress], functionName: "getInterestPercentForCollection"}]
         const hash = await contractFunction(param[0])
         const percent = parseInt(hash["_hex"]) / 10000
         setSelectedInterest(percent)
         param = [{data : [address, borrowItems[0].tokenAddress], functionName: "getBorrowingPowerForAddressAndCollection"}]
         const borrowLimit = await contractFunction(param[0])
         setBorrowLimit(parseFloat(parseFloat(ethers.utils.formatEther(borrowLimit["_hex"])).toFixed(4)))
         const strDropDown = borrowItems[0].collectionName + " - " + percent + "% APY"
         setDropdownText(strDropDown)
        }
       }
       setLoadingNfts(false)
      }
    }

  const handleApprove = async (nftAddress, address, tokenID) => {
    const signer = injectedProvider.getSigner()
    const objNFT = new ethers.Contract(nftAddress, NFT, signer)
    let hash = await objNFT["approve"](address, tokenID)
    statusNotification("info", "Transaction in progress", hash["hash"])
    const result = await hash.wait();
    if(result["status"] == 1) {
      statusNotification("success", "NFT approved", result["hash"])
    } else {
      statusNotification("error", "Failed approve", "")
    }
    return hash;
  }

  const handleCheck = (val) => {
    return purpose.some(item => parseInt(item, 16).toString(16) == parseInt(val, 16).toString(16));
  }
  const openDiscord = () => {
    window.open("https://discord.gg/XTR8F8hZZB", "_blank")
  }

  const openGithub = () => {
    window.open("https://github.com/tangeloprotocol/contracts", "_blank")
  }
  const openTwitter = () => {
    window.open("https://twitter.com/tangeloxyz", "_blank")
  }

  const [depositAmount, setDepositAmount] = useState()
  const [withdrawAmount, setWithdrawAmount] = useState()
  const [borrowing, setBorrowing] = useState(false)
  const [ethDeposit, setEthDeposit] = useState(false)

  const handleBorrowAmount = (e) => {
    setDepositAmount(e)
  }

  const handleWithdrawAmount = (e) => {
    setWithdrawAmount(e)
  }

  function myFormat(num) {
    if(num === "") {
      return "";
    }
    return num + ' ETH';
  }

  const handleMenuClick = async (e) => {
    let item = borrowNfts.filter (item => item.tokenAddress == e.key)
    setSelectedCollection(item[0])
    let param = [{data : [item[0].tokenAddress], functionName: "getInterestPercentForCollection"}]
    setSelectedInterest("-")
    const hash = await contractFunction(param[0])
    setSelectedInterest(parseInt(hash["_hex"]) / 10000)
    param = [{data : [address, item[0].tokenAddress], functionName: "getBorrowingPowerForAddressAndCollection"}]
    const borrowLimit = await contractFunction(param[0])
    setBorrowLimit("0")
    setBorrowLimit(parseFloat(parseFloat(ethers.utils.formatEther(borrowLimit["_hex"])).toFixed(4)))
  };

  const [selectedCollection, setSelectedCollection] = useState()
  const [selectedInterest, setSelectedInterest] = useState("-")
  const [borrowLimit, setBorrowLimit] = useState("0")
  const [dropdownText, setDropdownText] = useState("")

  useEffect(() => {
    if(selectedCollection != undefined && selectedInterest != "-" && borrowLimit != "0") {
      const strDropDown = selectedCollection.collectionName + " - " + selectedInterest + "% APY"
      setDropdownText(strDropDown)
    }
  }, [selectedCollection, selectedInterest, borrowLimit])

  let menu = (
      <Menu onClick={handleMenuClick}>
        {
          borrowNfts.map((item, i) => (
            <Menu.Item key={item.tokenAddress}>{item.collectionName}</Menu.Item>
          ))
        }
      </Menu>
  );

  const handleLoan = async () => {
    setBorrowing(true)
    if(depositAmount == undefined) {
      alert("Please enter amount to borrow.")
      setBorrowing(false)
      return;
    }
    const bigValue = ethers.utils.parseUnits(depositAmount.toString())
    try {
      const param = [{data : [bigValue["_hex"], selectedCollection.tokenAddress], functionName: "takeLoan"}]
      const hash = await contractFunction(param[0])
      statusNotification("info", "Transaction in progress", hash["hash"])
      const result = await hash.wait();
      if(result["status"] == 1) {
        statusNotification("info", "Loan borrowed " + amount + " ETH", hash["hash"])
      } else {
        statusNotification("info", "Failed borrow", "")
      }
      setBorrowing(false)
    } catch(e) {
      setBorrowing(false)
      if(e["error"] && e["error"]["message"]) {
        const strMsg = e["error"]["message"];
        statusNotification("error", strMsg.replace("execution reverted", "").replace(":", ""), "")
      } else {
        statusNotification("error", "Failed", "")
      }
    }
  }

  const handleWRepay = async () => {
    setBorrowing(true)
    if(withdrawAmount == undefined) {
      alert("Please enter amount to repay.")
      setBorrowing(false)
      return;
    }
    const bigValue = ethers.utils.parseUnits(withdrawAmount.toString())
       
    try {
      const param = [{data : [selectedCollection.tokenAddress, ({value: bigValue})], functionName: "repayLoan"}]
      const hash = await contractFunction(param[0])
      statusNotification("info", "Transaction in progress", hash["hash"])
      const result = await hash.wait();
      if(result["status"] == 1) {
        statusNotification("info", "Loan repaid " + amount + " ETH", hash["hash"])
      } else {
        statusNotification("info", "Failed repay", "")
      }
      setBorrowing(false)
    } catch(e) {
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
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header
        address={address}
        localProvider={localProvider}
        userSigner={userSigner}
        mainnetProvider={mainnetProvider}
        price={price}
        web3Modal={web3Modal}
        loadWeb3Modal={loadWeb3Modal}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        blockExplorer={blockExplorer}
        setRoute={setRoute} />
      {networkDisplay}

      <BrowserRouter>
        <Menu selectedKeys={[route]} className="black-background tangelo-menu" style={{border: "none"}}>
          <Menu.Item key="/" className="btn_borrow btn righteous">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              borrow
            </Link>
          </Menu.Item>
          <Menu.Item key="/lending" className="btn_earn btn righteous">
            <Link
              onClick={() => {
                setRoute("/lending");
              }}
              to="/lending"
            >
              earn
            </Link>
          </Menu.Item>
        </Menu>
        <Switch>
          <Route exact path="/">
            <Layout className="main_layout black-background">
              <Content className="content_borrow_edit">
                
              </Content>
              {modalButtons}
              <Content className="borrow_power">
                <Content className="borrow_bar">
                  <Progress percent={powerPercent} size="small" style={{width: "100%"}} showInfo={false} trailColor={"#FFF3C2"} strokeColor={"#F78B0D"} className="ether_value" />
                  <Text className="borrow_power_percent righteous">{powerPercent}%</Text>
                </Content>
                <Content className="borrow_power_eth">
                  <Text className="borrow_power_percent righteous">{borrowPower} ETH</Text>
                  <Text className="borrow_power_percent righteous">borrow power</Text>
                </Content>
              </Content>
              <Content className="collateral_container">
                <Layout className="collateral_card">
                  <Text className="title righteous">collateral</Text>
                  <Content className="collateral_panel">
                    <Content className="collateral_header">
                      <Text className="righteous header_title">asset</Text>
                      <Text className="righteous header_title">borrow power</Text>
                      <Text className="righteous header_title">collateral</Text>
                    </Content>
                    { web3Modal && web3Modal.cachedProvider && loadingNfts && (
                      <div className="loading-container">
                        <div className="loader">
                          <div className="loading-bars">
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                          </div>
                        </div>
                      </div>
                    ) }
                    { web3Modal && web3Modal.cachedProvider && !loadingNfts && nfts.length == 0 && (
                      <span className="righteous no_nft">No NFTs found in wallet</span>
                    ) }
                    { web3Modal && !web3Modal.cachedProvider && (
                      <span className="righteous no_nft">Connect wallet to deposit NFTs and borrow ETH</span>
                    ) }
                    {
                      availableNfts.map((nft, i) => (
                        <Borrow 
                          key={i}
                          nft={nft.contract}
                          image={nft.image}
                          name={nft.name}
                          tokenID={nft.tokenId}
                          contract={readContracts}
                          address={nft.tokenAddress}
                          statusNotification={statusNotification}
                          handleApprove={handleApprove}
                          days="30"/>
                      ))
                    }
                    {
                      tangeloNfts.map((nft, i) => (
                        <Repay 
                          key={i}
                          tokenID={nft.tokenId}
                          contract={readContracts}
                          statusNotification={statusNotification}
                          provider={injectedProvider}/>
                      ))
                    }
                    {
                      requestNfts.map((nft, i) => (
                        <WhitelistRequest 
                          key={i}
                          image={nft.image}
                          name={nft.name}/>
                      ))
                    }
                  </Content>
                </Layout>
                <Layout className="collateral_borrow">
                  <Text className="title righteous">borrow</Text>
                  <Tabs>
                    <div label="borrow">
                      <Text className="deposit_title righteous">{borrowBalance} / {borrowLimit} ETH max</Text>
                      <Content className="collection_list">
                        <Text className="borrow_title righteous">borrow against</Text>
                        <Dropdown overlay={menu} trigger={['click']}>
                          <a className="ant-dropdown-link dropdown" onClick={e => e.preventDefault()}>
                          {dropdownText} { dropdownText != "" && (<svg width="34" height="21" viewBox="0 0 34 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M17.004 20.0053L0.55208 0.500623L33.4681 0.510964L17.004 20.0053Z" fill="#F78B0D"/>
                                     </svg>)}
                          </a>
                        </Dropdown>
                      </Content>
                      <Content className="borrow_amuont">
                        <Text className="amount_title righteous">amount</Text>
                        <NumericInput min={0} format={myFormat} className="btn_ether white-light righteous" placeholder="amount in ETH" onChange={handleBorrowAmount.bind(this)} value={depositAmount}/>
                        <Button className="btn_deposit btn light-dark righteous" style={{width: "100%"}} onClick={handleLoan} disabled={borrowing}>
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
                              <span>borrow</span>
                          )}
                        </Button>
                      </Content>
                    </div>
                    <div label="repay">
                      <Text className="deposit_title righteous">{borrowBalance} / {borrowLimit} ETH max</Text>
                      <Content className="collection_list">
                        <Text className="borrow_title righteous">borrow against</Text>
                        <Dropdown overlay={menu} trigger={['click']}>
                          <a className="ant-dropdown-link dropdown" onClick={e => e.preventDefault()}>
                          {dropdownText} { dropdownText != "" && (<svg width="34" height="21" viewBox="0 0 34 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M17.004 20.0053L0.55208 0.500623L33.4681 0.510964L17.004 20.0053Z" fill="#F78B0D"/>
                                     </svg>)}
                          </a>
                        </Dropdown>
                      </Content>
                      <Content className="borrow_amuont">
                        <Text className="amount_title righteous">amount</Text>
                        <NumericInput min={0} format={myFormat} className="btn_ether white-light righteous" placeholder="amount in ETH" onChange={handleWithdrawAmount.bind(this)} value={withdrawAmount}/>
                        <Button className="btn_deposit btn light-dark righteous" style={{width: "100%"}} onClick={handleWRepay} disabled={borrowing}>
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
                              <span>repay</span>
                          )}
                        </Button>
                      </Content>
                    </div>
                  </Tabs>
                </Layout>
              </Content>
              <Content className="content_faq">
                <Text className="righteous faq_title righteous white-text">faq</Text>
                <Layout className="sub_content_faq black-background">
                  <Content className="faq">
                    <Text className="faq_title righteous white-text">how does tangelo work?</Text>
                    <Text className="faq_answer righteous white-text">tangelo is a two sided protocol where lenders earn yield by lending ETH to borrowers who deposit their NFTs as collateral to take out loans.</Text>
                  </Content>
                  <Content className="faq">
                    <Text className="faq_title righteous white-text">what happens to my NFT?</Text>
                    <Text className="faq_answer righteous white-text">your NFT is stored safely in the tangelo vault for the duration of your loan. when you pay back your loan, your NFT is returned.</Text>
                  </Content>
                  <Content className="faq">
                    <Text className="faq_title righteous white-text">what happens if someone doesn’t repay their loan?</Text>
                    <Text className="faq_answer righteous white-text">the NFT will be auctioned and the funds will go back to the lending pool.</Text>
                  </Content>
                </Layout>
              </Content>
              <Content className="copyright">
                <Text>freshly squeezed. 2021. 🍊</Text>
                <div className="tangelo-footer">
                <Button className="btn_borrow btn dark righteous" onClick={openDiscord}>
                discord
              </Button>
              <div style={{width: "10px"}}></div>
              <Button className="btn_borrow btn dark righteous" onClick={openGithub}>
                github
              </Button>
              <div style={{width: "10px"}}></div>
              <Button className="btn_borrow btn dark righteous" onClick={openTwitter}>
                twitter
              </Button>
              </div>

              </Content>
       
            </Layout>
          </Route>
          <Route exact path="/lending" component={Lending}>
            <Lending
              injectedProvider={injectedProvider}
              purpose={purpose}
              vault={vaultAmount}
              vaultCap={vaultCap}
              availableWithdraw={availableWithdraw}
              depositEther={depositEther}
              withdrawEther={withdrawEther}
              borrowing={ethDeposit}/>
          </Route>
        </Switch>
      </BrowserRouter>
      
    </div>
  );
}

export default App;


