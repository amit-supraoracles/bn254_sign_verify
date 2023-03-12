const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('https://goerli.infura.io/v3/24272f51b0e14602ac6f2f13384a4326'));

const contractABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "verify", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" } ];
const contractAddress = '0x15f5014B58c8325CC0849CBC2736676581F0b0e1'; 
const contract = new web3.eth.Contract(contractABI, contractAddress);

const functionABI = contract.methods.verify().encodeABI();

const estimateGas = async () => {
  try {
    const gas = await web3.eth.estimateGas({
      to: contractAddress,
      data: functionABI
    });

    console.log('Gas estimate:', gas);
  } catch (error) {
    console.error(error);
  }
}

estimateGas();
