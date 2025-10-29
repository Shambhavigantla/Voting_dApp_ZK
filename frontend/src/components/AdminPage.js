import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function getRevertReason(error) {
  var message = (error && error.message) ? error.message : '';
  var m = message.match(/revert\s*([^"]*)/);
  if (m && m[1]) return m[1].trim();
  if (error && error.data && error.data.message) return error.data.message;
  return 'An unknown error occurred.';
}

const AdminPage = () => {
  const { account, contract, isAdmin } = useWeb3();
  const [voterAddress, setVoterAddress] = useState('');
  const [registeredVoters, setRegisteredVoters] = useState([]);
  const [message, setMessage] = useState('');

  const fetchRegisteredVoters = useCallback(async () => {
    if (!contract) return;
    try {
      // try owner-only getter first
      var voters = await contract.methods.getVoters().call({ from: account });
      if (voters && voters.length) {
        setRegisteredVoters(voters);
        return;
      }
    } catch (e) {
      // ignore - fall back to events if getter is not available or caller isn't owner
    }

    // fallback: try events (best-effort)
    try {
      if (contract.getPastEvents) {
        var events = await contract.getPastEvents('VoterRegistered', { fromBlock: 0, toBlock: 'latest' });
        var unique = [];
        events.forEach(function(ev) {
          var v = ev.returnValues && (ev.returnValues.voter || ev.returnValues._voterAddress || ev.returnValues._voter);
          if (v && unique.indexOf(v) === -1) unique.push(v);
        });
        setRegisteredVoters(unique);
      } else {
        setRegisteredVoters([]);
      }
    } catch (err) {
      setRegisteredVoters([]);
    }
  }, [contract, account]);

  useEffect(function() {
    fetchRegisteredVoters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRegisteredVoters]);

  const handleRegister = async () => {
    if (!contract || !account) {
      setMessage('Please connect your wallet first.');
      return;
    }
    if (!voterAddress) {
      setMessage('Enter a voter address.');
      return;
    }
    try {
      setMessage('Sending transaction...');
      await contract.methods.registerVoter(voterAddress).send({ from: account });
      setMessage('Voter registered successfully.');
      setVoterAddress('');
      fetchRegisteredVoters();
    } catch (error) {
      var reason = getRevertReason(error);
      setMessage('Error: ' + reason);
    }
  };

  if (!account) {
    return (
      <div className="page-container">
        <div className="card">
          <h3>Admin Dashboard</h3>
          <p>Please connect your wallet to continue.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="card">
          <h3>Access Denied</h3>
          <p>Your connected account (<strong>{account}</strong>) is not the admin/owner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Admin Dashboard</h2>
      <p>Connected as: <strong>{account || 'Not Connected'}</strong></p>

      <div className="card">
        <h3>Register a New Voter</h3>
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter voter's wallet address"
            value={voterAddress}
            onChange={function(e){ setVoterAddress(e.target.value); }}
          />
          <button onClick={handleRegister}>Register Voter</button>
        </div>
        {message && <p className="message">{message}</p>}
      </div>

      <div className="card">
        <h3>Currently Registered Voters ({registeredVoters.length})</h3>
        <ul className="voter-list">
          {registeredVoters.length > 0 ? registeredVoters.map(function(voter, i) {
            return <li key={voter + i}>{voter}</li>;
          }) : <li>No voters registered yet.</li>}
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;