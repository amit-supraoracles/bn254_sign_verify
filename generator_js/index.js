const mcl = require('mcl-wasm');
const { sha256, hexlify } = require('ethers/lib/utils');
const {hexToUint8Array, stringToUint8Array, g1ToHex, g2ToHex, verify, getKeyPairBySeed, sign, serializeSecret} = require("./utils.js");

async function main() {
    await mcl.init(mcl.BN_SNARK1);
    mcl.setMapToMode(mcl.BN254);

    let domain = hexToUint8Array("0x0000000000000000000000000000000000000000000000000000000000000020");

    let keyPair = getKeyPairBySeed("fixed-key");

    const message = sha256(stringToUint8Array("hello"));
    console.log({"message": message});
    const { signature, message_point } = sign(message, keyPair.secret, domain);
    console.log({sig: g1ToHex(signature), msg_point: g1ToHex(message_point)});

    console.log({private_key: hexlify(serializeSecret(keyPair.secret)), public_key: g2ToHex(keyPair.public_key)});

    console.log({"verify": verify(signature, keyPair.public_key, message_point)})


}

main();