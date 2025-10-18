import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const getRevertReason = (error) => {
    const message = error.message || '';
    const revertReasonMatch = message.match(/revert\s*([^"]*)/);
    if (revertReasonMatch && revertReasonMatch[1]) return revertReasonMatch[1].trim();
    if (error.data && error.data.message) return error.data.message;
    return "An unknown error occurred.";
};

const VotingPage = () => {
    const { account, contract } = useWeb3();
    const [candidates, setCandidates] = useState([]);
    const [results, setResults] = useState({});
    const [message, setMessage] = useState('');
    const [totalVotes, setTotalVotes] = useState(0);

    const fetchCandidatesAndResults = useCallback(async () => {
        if (contract) {
            try {
                const candidateList = await contract.methods.getCandidates().call();
                setCandidates(candidateList);
                let total = 0;
                const resultsData = {};
                for (const name of candidateList) {
                    const voteCount = await contract.methods.votesPerCandidate(name).call();
                    resultsData[name] = parseInt(voteCount);
                    total += parseInt(voteCount);
                }
                setResults(resultsData);
                setTotalVotes(total);
            } catch (error) {
                setMessage("Could not fetch election data. Are you on the right network?");
            }
        }
    }, [contract]);

    useEffect(() => {
        fetchCandidatesAndResults();
    }, [fetchCandidatesAndResults]);

    const handleVote = async (candidateName) => {
        if (!contract || !account) {
            setMessage('Please connect your wallet to vote.');
            return;
        }
        try {
            setMessage(`Casting vote for ${candidateName}...`);
            await contract.methods.vote(candidateName).send({ from: account });
            setMessage('Vote cast successfully! Results are updating.');
            fetchCandidatesAndResults();
        } catch (error) {
            const reason = getRevertReason(error);
            setMessage(`Error: ${reason}`);
        }
    };

    return (
        <div className="page-container">
            <h2>Official Voting Booth</h2>
            <p>Connected as: <strong>{account || 'Not Connected'}</strong></p>
            {message && <p className="message">{message}</p>}

            <h3>Candidates</h3>
            <div className="card-container">
                {candidates.length > 0 ? candidates.map((name) => (
                    <div className="card candidate-card" key={name}>
                        <h4>{name}</h4>
                        <button onClick={() => handleVote(name)}>Vote for {name}</button>
                    </div>
                )) : <p>Loading candidates...</p>}
            </div>

            <hr />

            <h3>Live Election Results</h3>
            <div className="card">
                {Object.entries(results).map(([name, count]) => {
                    const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
                    return (
                        <div className="result-bar" key={name}>
                            <div className="result-info">
                                <span>{name} ({count} votes)</span>
                                <span>{percentage}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    );
                })}
                <p><strong>Total Votes Cast: {totalVotes}</strong></p>
                <button onClick={fetchCandidatesAndResults}>Refresh Results</button>
            </div>
        </div>
    );
};

export default VotingPage;