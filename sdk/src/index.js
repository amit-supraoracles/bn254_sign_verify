const {
    ContractExecuteTransaction,
    ContractCreateTransaction, FileAppendTransaction, FileCreateTransaction, Client
} = require("@hashgraph/sdk");
require('dotenv').config()

const verifyContractJson = require("./contracts/Verify.json");
const {Interface} = require("ethers/lib/utils");

let contractId;

const operatorClient = Client.forName(process.env.HEDERA_NETWORK);

async function main() {

    operatorClient.setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);

    contractId = await deployVerifyContract(operatorClient);
    console.log(`  contractId = ${contractId}`);

    await testVerify();

    console.log(`Done`);
}

async function deployVerifyContract(client) {
    // deploy the smart contract as operator
    // upload the file
    console.log("Creating file");
    let transaction = new FileCreateTransaction()
        .setKeys([client.operatorPublicKey])
        .setContents("");

    let receipt = await execWithReceipt(transaction, client);
    const fileId = receipt.fileId;

    console.log(`  appending to file`);
    // append to file
    transaction = await new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(verifyContractJson.bytecode);
    await execWithReceipt(transaction, client);

    console.log(`  fileId ${fileId.toString()}`);

    // deploy the contract
    console.log(`Deploying contract`);
    transaction = new ContractCreateTransaction()
        .setBytecodeFileId(fileId)
        .setGas(1_000_000);

    receipt = await execWithReceipt(transaction, client);
    return receipt.contractId;
}

async function execWithReceipt(transaction, client) {
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return receipt;
}

async function execWithRecord(transaction, client) {
    const response = await transaction.execute(client);
    const record = await response.getRecord(client);
    return record;
}


async function testVerify() {
    const abi = verifyContractJson.abi;
    const abiInterface = new Interface(abi);

    const functionParameters = encodeFunctionParameters(
        abi,
        'verify',
        []
    );

    const transaction = new ContractExecuteTransaction()
        .setGas(320000)
        .setContractId(contractId)
        .setFunctionParameters(functionParameters)
        .setMaxTransactionFee(100);

    const record = await execWithRecord(transaction, operatorClient);

    const result = abiInterface.decodeFunctionResult("verify", record.contractFunctionResult.bytes);
    console.log(`Result ${result[0]}`);
}

function encodeFunctionParameters(abi, functionName, parameterArray) {
    const abiInterface = new Interface(abi);
    const functionCallAsHexString = abiInterface.encodeFunctionData(functionName, parameterArray).slice(2);
    // convert to a Uint8Array
    return fromHex(functionCallAsHexString);
}

function fromHex(hexString) {
    const bytes = new Uint8Array(Math.floor((hexString || "").length / 2));
    let i;
    for (i = 0; i < bytes.length; i++) {
        // @ts-ignore
        const a = MAP_HEX[hexString[i * 2]];
        // @ts-ignore
        const b = MAP_HEX[hexString[i * 2 + 1]];
        if (a === undefined || b === undefined) {
            break;
        }
        bytes[i] = (a << 4) | b;
    }
    return i === bytes.length ? bytes : bytes.slice(0, i);
}

const HEX_STRINGS = "0123456789abcdef";
const MAP_HEX = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
    7: 7, 8: 8, 9: 9, a: 10, b: 11, c: 12, d: 13,
    e: 14, f: 15, A: 10, B: 11, C: 12, D: 13,
    E: 14, F: 15
};

void main();
