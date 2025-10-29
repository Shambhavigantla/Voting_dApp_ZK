import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function getRevertReason(error) {
  var message = (error && error.message) ? error.message : '';
  var m = message.match(/revert\s*([^"]*)/);
  if (m && m[1]) return m[1].trim();
  if (error && error.data && error.data.message) return error.data.message;
  return 'An unknown error occurred.';
}

const VotingPage = () => {
  const { account, contract } = useWeb3();
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [message, setMessage] = useState('');
  const [loadingCandidate, setLoadingCandidate] = useState(null);

  const fetchCandidatesAndResults = useCallback(async function() {
    if (!contract) return;
    try {
      var list = await contract.methods.getCandidates().call();
      setCandidates(list || []);
      var data = {};
      var total = 0;
      for (var i = 0; i < list.length; i++) {
        var name = list[i];
        var cnt = await contract.methods.votesPerCandidate(name).call();
        var n = parseInt(cnt || 0, 10);
        data[name] = n;
        total += n;
      }
      setResults(data);
      setTotalVotes(total);
    } catch (err) {
      setMessage('Could not fetch election data. Check network or contract.');
    }
  }, [contract]);

  useEffect(function() {
    fetchCandidatesAndResults();
    // poll every 6 seconds for live updates
    var id = setInterval(function(){ fetchCandidatesAndResults(); }, 6000);
    return function(){ clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCandidatesAndResults]);

  const handleVote = async function(candidateName) {
    if (!contract || !account) {
      setMessage('Please connect your wallet to vote.');
      return;
    }
    try {
      setLoadingCandidate(candidateName);
      setMessage('Submitting vote...');
      await contract.methods.vote(candidateName).send({ from: account });
      setMessage('Vote cast successfully. Updating results...');
      await fetchCandidatesAndResults();
    } catch (error) {
      var reason = getRevertReason(error);
      setMessage('Error: ' + reason);
    } finally {
      setLoadingCandidate(null);
    }
  };

  return (
    <div className="page-container">
      <h2>Voting Booth</h2>
      <p>Connected as: <strong>{account || 'Not Connected'}</strong></p>
      {message && <p className="message">{message}</p>}

      <h3>Candidates</h3>
      <div className="card-container">
        {candidates.length > 0 ? candidates.map(function(name) {
          var count = results[name] || 0;
          var pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          return (
            <div className="card candidate-card" key={name}>
              <h4>{name}</h4>
              <button onClick={function(){ handleVote(name); }} disabled={loadingCandidate && loadingCandidate !== name}>
                {loadingCandidate === name ? 'Submitting...' : 'Vote for ' + name}
              </button>
              <div className="result-bar">
                <div className="result-info">
                  <span>{name} ({count} votes)</span>
                  <span>{pct.toFixed(1)}%</span>
                </div>
                <div className="progress-bar" aria-hidden="true">
                  <div className="progress" style={{ width: pct + '%' }}></div>
                </div>
              </div>
            </div>
          );
        }) : <p>Loading candidates...</p>}
      </div>

      <div className="card">
        <strong>Total Votes: {totalVotes}</strong><br />
        <button onClick={fetchCandidatesAndResults} style={{ marginTop: 12 }}>Refresh Results</button>
      </div>
    </div>
  );
};

export default VotingPage;