import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import VotingABI from '../artifacts/contracts/Voting.sol/Voting.json';

// UPDATED: improved revert reason extractor
const getRevertReason = (error) => {
  if (!error) return 'Unknown error occurred';

  // Common user-rejection code from MetaMask
  if (error.code === 4001 || (error.message && error.message.toLowerCase().includes('user denied'))) {
    return 'Transaction rejected by user';
  }

  // Check nested error.data.message first (common in web3.js errors)
  if (error.data && error.data.message && typeof error.data.message === 'string') {
    const nestedMsg = error.data.message;
    // Extract the actual revert reason from the message
    const match = nestedMsg.match(/reverted with reason string '([^']+)'/);
    if (match && match[1]) return match[1];
    // Also check for other formats
    const match2 = nestedMsg.match(/reverted: "?([^"]+)"?/);
    if (match2 && match2[1]) return match2[1];
    return nestedMsg;
  }

  // Try to extract hex revert data
  try {
    let dataHex = null;
    if (error.data && typeof error.data === 'string') dataHex = error.data;
    else if (error.data && error.data.data && typeof error.data.data === 'string') dataHex = error.data.data;
    else if (error.error && error.error.data && typeof error.error.data === 'string') dataHex = error.error.data;

    if (dataHex && typeof dataHex === 'string' && dataHex.startsWith('0x') && dataHex.length > 138) {
      const reasonHex = '0x' + dataHex.slice(138);
      const reason = Web3.utils.hexToAscii(reasonHex).replace(/\u0000/g, '');
      if (reason) return reason;
    }
  } catch (e) {
    // ignore
  }

  // Fallback: parse message text patterns
  const msg = (error && error.message) ? error.message : '';
  const patterns = [
    /reverted with reason string '([^']+)'/i,
    /execution reverted: "?(.*?)"?(\n|$)/i,
    /execution reverted: (.*?)$/i,
    /reason string "([^"]+)"/i,
    /revert (.*?)$/i
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m && m[1]) return m[1].trim();
  }

  // Fallback
  if (msg) return msg;
  return 'Unknown error occurred';
};

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
    <Web3Context.Provider value={{ web3, account, contract, owner, isAdmin, getRevertReason }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);