import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const VotingBooth = () => {
    const { account, contract } = useWeb3();
    const [candidates, setCandidates] = useState([]);
    const [results, setResults] = useState({});
    const [message, setMessage] = useState('');

    const fetchCandidatesAndResults = useCallback(async () => {
        if (contract) {
            try {
                const candidateList = await contract.methods.getCandidates().call(); // Changed this line
                setCandidates(candidateList);

                const resultsData = {};
                for (const name of candidateList) {
                    const voteCount = await contract.methods.votesPerCandidate(name).call();
                    resultsData[name] = voteCount;
                }
                setResults(resultsData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setMessage("Could not fetch data from the contract.");
            }
        }
    }, [contract]);

    useEffect(() => {
        fetchCandidatesAndResults();
    }, [fetchCandidatesAndResults]);

    const handleVote = async (candidateName) => {
        if (!contract || !account) {
            setMessage('Please connect your wallet first.');
            return;
        }
        try {
            setMessage(`Casting vote for ${candidateName}...`);
            await contract.methods.vote(candidateName).send({ from: account });
            setMessage('Vote cast successfully! Refreshing results...');
            fetchCandidatesAndResults(); // Refresh results after voting
        } catch (error) {
            console.error(error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Voting Booth</h2>
            <p>Connected Account: {account || 'Not Connected'}</p>
            <h3>Candidates</h3>
            {candidates.map((name) => (
                <button key={name} onClick={() => handleVote(name)}>
                    Vote for {name}
                </button>
            ))}
            {message && <p>{message}</p>}

            <hr />
            <h3>Live Results</h3>
            <button onClick={fetchCandidatesAndResults}>Refresh Results</button>
            <ul>
                {Object.entries(results).map(([name, count]) => (
                    <li key={name}>{name}: {count} votes</li>
                ))}
            </ul>
        </div>
    );
};

export default VotingBooth;