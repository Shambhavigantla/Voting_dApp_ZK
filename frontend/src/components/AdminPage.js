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
  // fallback: try nested structures
  if (error?.data && typeof error.data === 'string') {
    const m = error.data.match(/reverted with reason string '([^']+)'/);
    if (m && m[1]) return m[1];
  }
  return 'An unknown error occurred.';
}

const AdminPage = () => {
  const { account, isAdmin, contract, owner } = useWeb3();

  // local state
  const [electionName, setElectionName] = useState('');
  const [candidatesCsv, setCandidatesCsv] = useState('');
  const [elections, setElections] = useState([]); // { id, name }
  const [selectedElection, setSelectedElection] = useState(null);
  const [voterAddress, setVoterAddress] = useState('');
  const [bulkVotersCsv, setBulkVotersCsv] = useState('');
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: string }
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

  const showError = (text) => setMessage({ type: 'error', text });
  const showSuccess = (text) => setMessage({ type: 'success', text });

  const handleCreateElection = async () => {
    if (!contract || !isAdmin) { showError('Only admin can create elections.'); return; }
    const names = parseList(candidatesCsv);
    if (!electionName || names.length === 0) { showError('Provide election name and candidate list.'); return; }
    try {
      showSuccess('Creating election...');
      await contract.methods.createElection(electionName, names).send({ from: account });
      showSuccess('Election created.');
      setElectionName('');
      setCandidatesCsv('');
      await fetchElections();
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  const handleRegisterVoter = async () => {
    if (!contract || !isAdmin || !selectedElection) { showError('Select election and ensure you are admin.'); return; }
    if (!voterAddress) { showError('Enter voter address.'); return; }
    try {
      showSuccess('Registering voter...');
      await contract.methods.registerVoterForElection(selectedElection, voterAddress).send({ from: account });
      showSuccess('Voter registered.');
      setVoterAddress('');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  const handleRegisterBulk = async () => {
    if (!contract || !isAdmin || !selectedElection) { showError('Select election and ensure you are admin.'); return; }
    const list = parseList(bulkVotersCsv);
    if (list.length === 0) { showError('Enter addresses separated by commas.'); return; }
    try {
      showSuccess('Registering voters...');
      await contract.methods.registerVotersForElection(selectedElection, list).send({ from: account });
      showSuccess('Bulk registration complete.');
      setBulkVotersCsv('');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  return (
    <div className="page-container">
      <h2>Admin — Manage Elections</h2>

      {!account && (
        <div className="card" style={{ padding: 16 }}>
          <p>Please connect your wallet.</p>
        </div>
      )}

      {account && !isAdmin && (
        <div className="card" style={{ borderLeft: '4px solid #dc2626', backgroundColor: '#fff5f5', color: '#7f1d1d', padding: 16 }}>
          <h3 style={{ margin: 0 }}>Access Denied</h3>
          <p style={{ margin: '8px 0 0' }}>
            Connect with the admin account to access this page.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12 }}>
            Contract owner: <strong style={{ color: '#7f1d1d' }}>{owner || 'not loaded'}</strong>
          </p>
        </div>
      )}

      {account && isAdmin && (
        <>
          <div className="card" style={{ padding: 16 }}>
            <h3>Create New Election</h3>
            <input type="text" placeholder="Election name" value={electionName} onChange={e => setElectionName(e.target.value)} />
            <input type="text" placeholder="Candidates (comma separated)" value={candidatesCsv} onChange={e => setCandidatesCsv(e.target.value)} />
            <button onClick={handleCreateElection}>Create Election</button>
          </div>

          <div className="card" style={{ padding: 16 }}>
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

      {message && (
        <div
          className="card"
          style={{
            marginTop: 12,
            padding: 12,
            borderLeft: message.type === 'error' ? '4px solid #dc2626' : '4px solid #16a34a',
            backgroundColor: message.type === 'error' ? '#fff5f5' : '#f0fff4',
            color: message.type === 'error' ? '#7f1d1d' : '#065f46'
          }}
        >
          <p style={{ margin: 0 }}>{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;