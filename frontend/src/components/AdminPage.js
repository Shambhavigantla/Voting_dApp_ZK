import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const getRevertReason = (error) => {
    const message = error.message || '';
    const revertReasonMatch = message.match(/revert\s*([^"]*)/);
    if (revertReasonMatch && revertReasonMatch[1]) return revertReasonMatch[1].trim();
    if (error.data && error.data.message) return error.data.message;
    return "An unknown error occurred.";
};

const AdminPage = () => {
    const { account, contract } = useWeb3();
    const [voterAddress, setVoterAddress] = useState('');
    const [message, setMessage] = useState('');
    const [registeredVoters, setRegisteredVoters] = useState([]);

    const fetchRegisteredVoters = useCallback(async () => {
        if (contract) {
            try {
                const voters = await contract.methods.getRegisteredVoters().call({ from: account });
                setRegisteredVoters(voters);
            } catch (error) {
                // Non-admins can't call this, so we can ignore the error for them
            }
        }
    }, [contract, account]);

    useEffect(() => {
        fetchRegisteredVoters();
    }, [fetchRegisteredVoters]);

    const handleRegister = async () => {
        if (!contract || !account) {
            setMessage('Please connect your wallet first.');
            return;
        }
        try {
            setMessage('Processing registration...');
            await contract.methods.registerVoter(voterAddress).send({ from: account });
            setMessage(`Success! Voter ${voterAddress} is now registered.`);
            setVoterAddress('');
            fetchRegisteredVoters(); // Refresh the list
        } catch (error) {
            const reason = getRevertReason(error);
            setMessage(`Error: ${reason}`);
        }
    };

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
                        onChange={(e) => setVoterAddress(e.target.value)}
                    />
                    <button onClick={handleRegister}>Register Voter</button>
                </div>
                {message && <p className="message">{message}</p>}
            </div>

            <div className="card">
                <h3>Currently Registered Voters ({registeredVoters.length})</h3>
                <ul className="voter-list">
                    {registeredVoters.length > 0 ? registeredVoters.map((voter, index) => (
                        <li key={index}>{voter}</li>
                    )) : <li>No voters registered yet.</li>}
                </ul>
            </div>
        </div>
    );
};

export default AdminPage;