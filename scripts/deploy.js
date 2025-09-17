const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const candidateNames = ["Candidate A", "Candidate B", "Candidate C"];
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(candidateNames);

  await voting.deployed();

  console.log("Voting contract deployed to:", voting.address);

  // Export the contract's address and ABI
  const contractDir = __dirname + "/../frontend/src/artifacts/contracts";
  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir, { recursive: true });
  }

  fs.writeFileSync(
    contractDir + "/contract-address.json",
    JSON.stringify({ Voting: voting.address }, undefined, 2)
  );

  const contractArtifact = hre.artifacts.readArtifactSync("Voting");

  fs.writeFileSync(
    contractDir + "/Voting.json",
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });