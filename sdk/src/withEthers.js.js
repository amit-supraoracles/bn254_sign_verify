require('dotenv').config()

const verifyContractJson = require("./contracts/Verify.json");
const {ethers} = require("ethers");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_RELAY_URL);
    const wallet = new ethers.Wallet(process.env.ECDSA_PRIVATE_KEY, provider);
    const account = wallet.connect(provider);

    console.log(`Deploying contract`);
    const verifyContract = new ethers.ContractFactory(verifyContractJson.abi, verifyContractJson.bytecode, account);

    const contract = await verifyContract.deploy();

    console.log(`Contract deployed at address ${contract.address}`);

    // console.log(`Calling verify`);
    const result = await contract.verify();
    console.log(result);
}

void main();
