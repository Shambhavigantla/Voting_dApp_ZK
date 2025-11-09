import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import VotingABI from '../artifacts/contracts/Voting.sol/Voting.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (!window.ethereum) {
        console.error('MetaMask not found');
        return;
      }
      try {
        const w3 = new Web3(window.ethereum);
        setWeb3(w3);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await w3.eth.getAccounts();
        const acct = accounts && accounts[0] ? accounts[0] : null;
        setAccount(acct);

        // runtime contract address: prefer env, else fallback to artifact file if present
        const runtimeAddr = process.env.REACT_APP_CONTRACT_ADDRESS || (() => {
          try {
            // artifact written by deploy script into frontend/src/artifacts/contracts/contract-address.json
            // require at runtime (not top-level static import) to avoid build error when file missing
            // eslint-disable-next-line global-require
            const a = require('../artifacts/contracts/contract-address.json');
            return a && a.Voting ? a.Voting : null;
          } catch (e) {
            return null;
          }
        })();

        if (runtimeAddr) {
          const ctr = new w3.eth.Contract(VotingABI.abi, runtimeAddr);
          setContract(ctr);

          // fetch owner from contract
          try {
            const contractOwner = await ctr.methods.owner().call();
            setOwner(contractOwner);
            setIsAdmin(acct && contractOwner && acct.toLowerCase() === contractOwner.toLowerCase());
            console.info('Contract owner:', contractOwner);
          } catch (err) {
            console.warn('Could not read owner()', err);
          }
        } else {
          console.warn('Contract address not found. Deploy contract or set REACT_APP_CONTRACT_ADDRESS.');
        }

        // account change handler
        window.ethereum.on('accountsChanged', async (accounts) => {
          const newAcct = accounts && accounts[0] ? accounts[0] : null;
          setAccount(newAcct);
          // update isAdmin comparing with known owner
          setIsAdmin(newAcct && owner ? newAcct.toLowerCase() === owner.toLowerCase() : false);
          console.info('Account changed to', newAcct, 'isAdmin?', newAcct && owner ? (newAcct.toLowerCase() === owner.toLowerCase()) : false);
        });

      } catch (err) {
        console.error('Failed to init web3', err);
      }
    };

    initWeb3();

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ensure isAdmin updates when owner or account changes
  useEffect(() => {
    if (account && owner) {
      setIsAdmin(account.toLowerCase() === owner.toLowerCase());
    } else {
      setIsAdmin(false);
    }
  }, [account, owner]);

  return (
    <Web3Context.Provider value={{ web3, account, contract, owner, isAdmin }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);