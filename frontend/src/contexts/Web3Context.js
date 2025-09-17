import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import VotingContractABI from '../artifacts/contracts/Voting.sol/Voting.json';
import contractAddress from '../artifacts/contracts/contract-address.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                try {
                    const web3Instance = new Web3(window.ethereum);
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const accounts = await web3Instance.eth.getAccounts();
                    const contractInstance = new web3Instance.eth.Contract(
                        VotingContractABI.abi,
                        contractAddress.Voting
                    );

                    setWeb3(web3Instance);
                    setAccount(accounts[0]);
                    setContract(contractInstance);
                } catch (error) {
                    console.error("Could not connect to wallet.", error);
                }
            } else {
                console.error('Please install MetaMask!');
            }
        };

        initWeb3();
    }, []);

    return (
        <Web3Context.Provider value={{ web3, account, contract }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    return useContext(Web3Context);
};