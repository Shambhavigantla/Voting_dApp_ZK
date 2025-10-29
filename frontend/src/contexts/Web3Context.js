import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import VotingABI from '../artifacts/contracts/Voting.sol/Voting.json';
import contractAddressJson from '../artifacts/contracts/contract-address.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          const w3 = new Web3(window.ethereum);
          setWeb3(w3);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await w3.eth.getAccounts();
          const acct = accounts && accounts[0] ? accounts[0] : null;
          setAccount(acct);

          // load contract if artifacts are present
          const addr = contractAddressJson && contractAddressJson.Voting ? contractAddressJson.Voting : null;
          if (addr) {
            const ctr = new w3.eth.Contract(VotingABI.abi, addr);
            setContract(ctr);

            try {
              const contractOwner = await ctr.methods.owner().call();
              setOwner(contractOwner);
              setIsAdmin(acct && contractOwner && acct.toLowerCase() === contractOwner.toLowerCase());
            } catch (err) {
              // ignore owner read errors
            }
          }

          // handle account changes
          window.ethereum.on('accountsChanged', async (accounts) => {
            const newAcct = accounts && accounts[0] ? accounts[0] : null;
            setAccount(newAcct);
            setIsAdmin(newAcct && owner ? newAcct.toLowerCase() === owner.toLowerCase() : false);
          });
        } catch (err) {
          console.error('Failed to init web3', err);
        }
      } else {
        console.error('Please install MetaMask!');
      }
    };

    initWeb3();
    // cleanup listener on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [owner]);

  return (
    <Web3Context.Provider value={{ web3, account, contract, owner, isAdmin }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);