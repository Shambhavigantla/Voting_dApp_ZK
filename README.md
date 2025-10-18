# VoteChain - A Blockchain based Voting Platform

## Overview
VoteChain is a secure, transparent, and user-friendly electronic voting platform built on the Ethereum blockchain. Designed for college and community elections (e.g., class representatives, club leadership), it provides a trustworthy alternative to traditional polling methods.

This prototype leverages a React frontend for a modern user experience and a Solidity smart contract for backend logic, ensuring that all votes are recorded on an immutable ledger. It demonstrates the core mechanics of a decentralized application (dApp), including role-based access (admin/voter), on-chain vote casting, and real-time, transparent result tallying.

## Features
- **Modern User Interface**: A clean, professional, and responsive UI inspired by modern web applications.
- **Role-Based Dashboards**: Separate, intuitive interfaces for Election Administrators and Voters.
- **Admin-Controlled Registration**: A contract owner can securely register eligible voter addresses via an admin dashboard.
- **Live Voter Roll**: The admin dashboard displays a real-time list of all registered voters.
- **On-Chain Voting**: Registered voters can cast a single, secure vote for their chosen candidate.
- **Transparent & Real-Time Results**: Vote counts are tallied on the blockchain and displayed with live-updating progress bars for all to see.
- **User-Friendly Error Handling**: Displays clear, understandable error messages from the smart contract (e.g., "You have already voted.") instead of generic JSON errors.
- **Built-in Guide**: A "How to Use" page to guide new users through the process of setting up MetaMask and participating in an election.

## Project Structure
```
votechain/
├── contracts/
│   └── Voting.sol
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.js
│   │   │   ├── AdminPage.js
│   │   │   ├── VotingPage.js
│   │   │   └── HowToUsePage.js
│   │   ├── contexts/
│   │   │   └── Web3Context.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── scripts/
│   └── deploy.js
├── hardhat.config.js
├── package.json
└── README.md
```

## How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) and npm
- [MetaMask](https://metamask.io/) browser extension

### 1. Installation
1.  Clone the repository.
2.  Install backend dependencies from the project root:
    ```bash
    npm install
    ```
3.  Install frontend dependencies:
    ```bash
    cd frontend
    npm install
    cd ..
    ```

### 2. Run the Local Blockchain
In a new terminal, start the local Hardhat network. This simulates the Ethereum blockchain.
```bash
npx hardhat node
```
Keep this terminal running. It will display a list of test accounts and their private keys.

### 3. Deploy the Smart Contract
In a second terminal, run the deployment script. This compiles and deploys the contract to your local network.
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Run the Frontend Application
In a third terminal, start the React development server.
```bash
cd frontend
npm start
```
This will open the application in your browser at `http://localhost:3000`.

### 5. Configure MetaMask
1.  Open MetaMask and add a new network with these details:
    - **Network Name**: `Hardhat`
    - **New RPC URL**: `http://127.0.0.1:8545`
    - **Chain ID**: `1337`
2.  Import the first two accounts from the `npx hardhat node` terminal output into MetaMask using their private keys.
    - **Account #0** will be the contract owner (Admin).
    - **Account #1** will be a voter.

## Future Enhancements
- **Integrate Zero-Knowledge Proofs (ZKPs)**: To provide full voter anonymity while maintaining verifiability.
- **Dynamic Election Creation**: Allow admins to create new elections with different candidates directly from the UI.
- **Multi-factor Verification**: Combine with other ID checks for stronger eligibility assurance.
- **Mobile Integration**: Develop user-friendly mobile apps for broader accessibility.