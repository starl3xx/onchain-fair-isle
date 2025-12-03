import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Configuration
  const treasury = process.env.TREASURY_WALLET || deployer.address;
  const baseURI = process.env.BASE_TOKEN_URI || "https://your-domain.com/api/metadata/";
  const maxSupply = process.env.MAX_SUPPLY ? parseInt(process.env.MAX_SUPPLY) : 0; // 0 = unlimited

  console.log("Treasury:", treasury);
  console.log("Base URI:", baseURI);
  console.log("Max Supply:", maxSupply === 0 ? "Unlimited" : maxSupply);

  const FairIsleNFT = await ethers.getContractFactory("FairIsleNFT");
  const fairIsle = await FairIsleNFT.deploy(treasury, baseURI, maxSupply);

  await fairIsle.waitForDeployment();
  const address = await fairIsle.getAddress();

  console.log("\nFairIsleNFT deployed to:", address);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network base ${address} "${treasury}" "${baseURI}" ${maxSupply}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
