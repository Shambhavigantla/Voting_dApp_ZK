import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const VoterRegistration = () => {
    const { account, contract } = useWeb3();
    const [voterAddress, setVoterAddress] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async () => {
        if (!contract || !account) {
            setMessage('Please connect your wallet first.');
            return;
        }
        try {
            setMessage('Sending transaction...');
            const tx = await contract.methods.registerVoter(voterAddress).send({ from: account });
            setMessage(`Transaction successful! Voter ${voterAddress} registered.`);
            setVoterAddress('');
        } catch (error) {
            console.error(error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Voter Registration (Admin Only)</h2>
            <p>Connected Account: {account || 'Not Connected'}</p>
            <input
                type="text"
                placeholder="Enter voter address"
                value={voterAddress}
                onChange={(e) => setVoterAddress(e.target.value)}
            />
            <button onClick={handleRegister}>Register Voter</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default VoterRegistration;