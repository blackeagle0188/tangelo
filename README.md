# How it works

• We lend at the floor price of an NFT collection. By doing this, we can extend loans more widely and create a unified liquidity pool for lending. 
• There are 4 key events in our contract.

1. Deposit - lend ether to the vault 
1. Withdraw - withdraw ether plus gains / losses
1. Take Loan - deposit an NFT and get a loan in return
1. Repay Loan - repay a loan, with interest.

# Open questions

• Currently a vault manager will need to call whitelistCollection to change a parameter like the lending price for an NFT collection. Is the current setup gas inefficient?
• What vectors for abuse am I not thinking about? 
• Can large whale deposits be used to take gains and subsequantly remove liquidity and abuse the system?
• Can re-entrancy attacks be used in takeLoan or withdrawFunds?
# TODO
• Keep 10% of the vault liquid at all times for withdraws
• Clarify when vaultBalance and vaultBalanceAvailable should be adjusted. 


# Built with  🏗 Scaffold-ETH

> everything you need to build on Ethereum! 🚀

🧪 Quickly experiment with Solidity using a frontend that adapts to your smart contract:

![image](https://user-images.githubusercontent.com/2653167/124158108-c14ca380-da56-11eb-967e-69cde37ca8eb.png)


# 🏄‍♂️ Quick Start

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork 🏗 scaffold-eth:

```bash
git clone https://github.com/austintgriffith/scaffold-eth.git
```

> install and start your 👷‍ Hardhat chain:

```bash
cd scaffold-eth
yarn install
yarn chain
```

> in a second terminal window, start your 📱 frontend:

```bash
cd scaffold-eth
yarn start
```

> in a third terminal window, 🛰 deploy your contract:

```bash
cd scaffold-eth
yarn deploy
```

🔏 Edit the smart contract `Tangelo.sol` in `packages/hardhat/contracts`
📝 Edit your frontend `App.jsx` in `packages/react-app/src`
💼 Edit your deployment scripts in `packages/hardhat/deploy`
📱 Open http://localhost:3000 to see the app

# 📚 Documentation

Documentation, tutorials, challenges, and many more resources, visit: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)