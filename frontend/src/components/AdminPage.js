import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function parseList(input) {
  return input.split(',').map(s => s.trim()).filter(Boolean);
}

function getRevertReason(error) {
  const message = error?.message || '';
  const match = message.match(/revert\s*([^"]*)/);
  if (match && match[1]) return match[1].trim();
  if (error?.data?.message) return error.data.message;
  return 'An unknown error occurred.';
}

const AdminPage = () => {
  const { account, isAdmin, contract } = useWeb3();

  // local state
  const [electionName, setElectionName] = useState('');
  const [candidatesCsv, setCandidatesCsv] = useState('');
  const [elections, setElections] = useState([]); // { id, name }
  const [selectedElection, setSelectedElection] = useState(null);
  const [voterAddress, setVoterAddress] = useState('');
  const [bulkVotersCsv, setBulkVotersCsv] = useState('');
  const [message, setMessage] = useState('');
  const [voterList, setVoterList] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const fetchElections = useCallback(async () => {
    if (!contract) return;
    try {
      const count = await contract.methods.getElectionCount().call();
      const arr = [];
      for (let i = 1; i <= parseInt(count); i++) {
        const name = await contract.methods.getElectionName(i).call();
        arr.push({ id: i, name });
      }
      setElections(arr);
      if (arr.length && !selectedElection) setSelectedElection(arr[0].id);
    } catch (e) {
      setElections([]);
    }
  }, [contract, selectedElection]);

  const fetchSelectedDetails = useCallback(async (id) => {
    if (!contract || !id) return;
    try {
      const cand = await contract.methods.getCandidates(id).call();
      setCandidates(cand || []);
    } catch (e) {
      setCandidates([]);
    }
    try {
      const voters = await contract.methods.getVoters(id).call({ from: account });
      setVoterList(voters || []);
    } catch (e) {
      setVoterList([]); // if not owner or no getter, clear or fallback
    }
  }, [contract, account]);

  useEffect(() => { fetchElections(); }, [fetchElections]);

  useEffect(() => {
    if (selectedElection) fetchSelectedDetails(selectedElection);
  }, [selectedElection, fetchSelectedDetails]);

  const handleCreateElection = async () => {
    if (!contract || !isAdmin) { setMessage('Only admin can create elections.'); return; }
    const names = parseList(candidatesCsv);
    if (!electionName || names.length === 0) { setMessage('Provide election name and candidate list.'); return; }
    try {
      setMessage('Creating election...');
      await contract.methods.createElection(electionName, names).send({ from: account });
      setMessage('Election created.');
      setElectionName('');
      setCandidatesCsv('');
      await fetchElections();
    } catch (err) {
      setMessage('Error: ' + getRevertReason(err));
    }
  };

  const handleRegisterVoter = async () => {
    if (!contract || !isAdmin || !selectedElection) { setMessage('Select election and ensure you are admin.'); return; }
    if (!voterAddress) { setMessage('Enter voter address.'); return; }
    try {
      setMessage('Registering voter...');
      await contract.methods.registerVoterForElection(selectedElection, voterAddress).send({ from: account });
      setMessage('Voter registered.');
      setVoterAddress('');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      setMessage('Error: ' + getRevertReason(err));
    }
  };

  const handleRegisterBulk = async () => {
    if (!contract || !isAdmin || !selectedElection) { setMessage('Select election and ensure you are admin.'); return; }
    const list = parseList(bulkVotersCsv);
    if (list.length === 0) { setMessage('Enter addresses separated by commas.'); return; }
    try {
      setMessage('Registering voters...');
      await contract.methods.registerVotersForElection(selectedElection, list).send({ from: account });
      setMessage('Bulk registration complete.');
      setBulkVotersCsv('');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      setMessage('Error: ' + getRevertReason(err));
    }
  };

  return (
    <div className="page-container">
      <h2>Admin — Manage Elections</h2>
      {!account && <div className="card"><p>Please connect your wallet.</p></div>}
      {account && !isAdmin && <div className="card"><p>Access denied: Connect as the admin account.</p></div>}

      {account && isAdmin && (
        <>
          <div className="card">
            <h3>Create New Election</h3>
            <input type="text" placeholder="Election name" value={electionName} onChange={e => setElectionName(e.target.value)} />
            <input type="text" placeholder="Candidates (comma separated)" value={candidatesCsv} onChange={e => setCandidatesCsv(e.target.value)} />
            <button onClick={handleCreateElection}>Create Election</button>
          </div>

          <div className="card">
            <h3>Existing Elections</h3>
            <select value={selectedElection || ''} onChange={e => setSelectedElection(parseInt(e.target.value))}>
              {elections.map(ev => <option key={ev.id} value={ev.id}>{ev.id} — {ev.name}</option>)}
              {elections.length === 0 && <option value=''>No elections</option>}
            </select>
            <div style={{ marginTop: 12 }}>
              <h4>Candidates</h4>
              <ul>{candidates.map((c, i) => <li key={i}>{i}: {c}</li>)}</ul>
            </div>
            <div style={{ marginTop: 12 }}>
              <h4>Register Voters</h4>
              <input type="text" placeholder="Single voter address" value={voterAddress} onChange={e => setVoterAddress(e.target.value)} />
              <button onClick={handleRegisterVoter}>Register Voter</button>
              <p style={{ marginTop: 8 }}>Or bulk (comma separated):</p>
              <input type="text" placeholder="addr1, addr2, ..." value={bulkVotersCsv} onChange={e => setBulkVotersCsv(e.target.value)} />
              <button onClick={handleRegisterBulk}>Register Bulk</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <h4>Registered Voters ({voterList.length})</h4>
              <ul className="voter-list">{voterList.map((v, i) => <li key={v + i}>{v}</li>)}</ul>
            </div>
          </div>
        </>
      )}

      {message && <div className="card"><p>{message}</p></div>}
    </div>
  );
};

export default AdminPage;