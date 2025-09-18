// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Voting {
    address public owner;
    string[] public candidates;
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;
    mapping(string => uint256) public votesPerCandidate;

    event VoterRegistered(address indexed voter);
    event Voted(address indexed voter, string candidate);

    constructor(string[] memory _candidateNames) {
        owner = msg.sender;
        candidates = _candidateNames;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    function getCandidates() public view returns (string[] memory) {
        return candidates;
    }

    function registerVoter(address _voterAddress) public onlyOwner {
        require(!registeredVoters[_voterAddress], "Voter is already registered.");
        registeredVoters[_voterAddress] = true;
        emit VoterRegistered(_voterAddress);
    }

    function vote(string memory _candidateName) public {
        require(registeredVoters[msg.sender], "You are not registered to vote.");
        require(!hasVoted[msg.sender], "You have already voted.");

        bool validCandidate = false;
        for (uint i = 0; i < candidates.length; i++) {
            if (keccak256(abi.encodePacked(candidates[i])) == keccak256(abi.encodePacked(_candidateName))) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate.");

        hasVoted[msg.sender] = true;
        votesPerCandidate[_candidateName]++;
        emit Voted(msg.sender, _candidateName);
    }
}