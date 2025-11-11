import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const VotingPage = () => {
  const { account, contract, getRevertReason } = useWeb3();
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedElection, setSelectedElection] = useState(null);
  const [elections, setElections] = useState([]);
  const [loadingIdx, setLoadingIdx] = useState(null);

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
      console.error('Error fetching elections:', e);
      setElections([]);
    }
  }, [contract, selectedElection]);

  const fetchCandidatesAndResults = useCallback(async (eid) => {
    if (!contract || !eid) return;
    try {
      const cand = await contract.methods.getCandidates(eid).call();
      setCandidates(cand || []);
      const data = {};
      let total = 0;
      for (let i = 0; i < cand.length; i++) {
        const cnt = await contract.methods.getVotes(eid, i).call();
        const n = parseInt(cnt || 0, 10);
        data[i] = n;
        total += n;
      }
      setResults(data);
      setTotalVotes(total);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setCandidates([]);
      setResults({});
      setTotalVotes(0);
    }
  }, [contract]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  useEffect(() => {
    if (selectedElection) {
      fetchCandidatesAndResults(selectedElection);
      // Poll for updates every 6 seconds
      const interval = setInterval(() => {
        fetchCandidatesAndResults(selectedElection);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [selectedElection, fetchCandidatesAndResults]);

  const handleVote = async (candidateIndex) => {
    if (!contract || !account || !selectedElection) {
      setMessage('Please connect your wallet and select an election');
      return;
    }

    setLoadingIdx(candidateIndex);
    setMessage('');

    try {
      // Estimate gas to catch errors early
      await contract.methods
        .vote(selectedElection, candidateIndex)
        .estimateGas({ from: account });

      // Send actual transaction
      await contract.methods
        .vote(selectedElection, candidateIndex)
        .send({ from: account });

      setMessage('✓ Vote cast successfully!');
      setLoadingIdx(null);

      // Refresh results after vote
      setTimeout(() => {
        fetchCandidatesAndResults(selectedElection);
      }, 1000);

    } catch (error) {
      console.error('Vote error:', error);
      // Use getRevertReason to extract the actual error message
      const errorMsg = getRevertReason(error);
      setMessage('✗ ' + errorMsg);
      setLoadingIdx(null);
    }
  };

  return (
    <div className="page-container">
      <h2>Voting Booth</h2>
      <p>Connected as: <strong>{account || 'Not Connected'}</strong></p>

      {message && (
        <div className={`message ${message.startsWith('✗') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>Select Election</h3>
        <select
          value={selectedElection || ''}
          onChange={(e) => setSelectedElection(parseInt(e.target.value))}
        >
          {elections.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.id} — {ev.name}
            </option>
          ))}
          {elections.length === 0 && <option value="">No elections available</option>}
        </select>
      </div>

      <div className="card">
        <h3>Candidates</h3>
        <div className="card-container">
          {candidates.length > 0 ? (
            candidates.map((name, idx) => {
              const cnt = results[idx] || 0;
              const pct = totalVotes > 0 ? (cnt / totalVotes) * 100 : 0;
              return (
                <div key={idx} className="card candidate-card">
                  <h4>{name}</h4>
                  <button
                    onClick={() => handleVote(idx)}
                    disabled={loadingIdx !== null && loadingIdx !== idx}
                  >
                    {loadingIdx === idx ? 'Submitting...' : 'Vote for ' + name}
                  </button>
                  <div className="result-bar">
                    <div className="result-info">
                      <span>
                        {name} ({cnt} votes)
                      </span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: pct + '%' }}></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No candidates (select an election).</p>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <strong>Total Votes: {totalVotes}</strong>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;