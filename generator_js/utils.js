const mcl = require('mcl-wasm');
const { randomBytes,hexlify,sha256, arrayify, zeroPad} = require('ethers/lib/utils');
const {BigNumber} = require("ethers");
const {ethers} = require("ethers");

const FIELD_ORDER = BigNumber.from(
    "0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47"
);

function hashToField(
    domain,
    msg,
    count
) {
    const u = 48;
    const _msg = expandMsg(domain, msg, count * u);
    const els = [];
    for (let i = 0; i < count; i++) {
        const el = BigNumber.from(_msg.slice(i * u, (i + 1) * u)).mod(
            FIELD_ORDER
        );
        els.push(el);
    }
    return els;
}

function expandMsg(
    domain,
    msg,
    outLen
) {
    if (domain.length > 32) {
        throw new Error("bad domain size");
    }

    const out = new Uint8Array(outLen);

    const len0 = 64 + msg.length + 2 + 1 + domain.length + 1;
    const in0 = new Uint8Array(len0);
    let off = 64;    
    in0.set(msg, off);
    off += msg.length;
    in0.set([(outLen >> 8) & 0xff, outLen & 0xff], off);
    off += 2;
    in0.set([0], off);
    off += 1;
    in0.set(domain, off);
    off += domain.length;
    in0.set([domain.length], off);

    const b0 = sha256(in0);

    const len1 = 32 + 1 + domain.length + 1;
    const in1 = new Uint8Array(len1);
    in1.set(arrayify(b0), 0);
    off = 32;
    in1.set([1], off);
    off += 1;
    in1.set(domain, off);
    off += domain.length;
    in1.set([domain.length], off);

    const b1 = sha256(in1);

    const ell = Math.floor((outLen + 32 - 1) / 32);
    let bi = b1;

    for (let i = 1; i < ell; i++) {
        const ini = new Uint8Array(32 + 1 + domain.length + 1);
        const nb0 = zeroPad(arrayify(b0), 32);
        const nbi = zeroPad(arrayify(bi), 32);
        const tmp = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            tmp[i] = nb0[i] ^ nbi[i];
        }

        ini.set(tmp, 0);
        let off = 32;
        ini.set([1 + i], off);
        off += 1;
        ini.set(domain, off);
        off += domain.length;
        ini.set([domain.length], off);

        out.set(arrayify(bi), 32 * (i - 1));
        bi = sha256(ini);
    }

    out.set(arrayify(bi), 32 * (ell - 1));
    return out;
}


function hashToPoint(msg, domain) {
    if (!ethers.utils.isHexString(msg)) {
        throw new Error("message should be hex string");
    }

    const _msg = arrayify(msg);
    const [e0, e1] = hashToField(domain, _msg, 2);
    const p0 = mapToPoint(e0);
    const p1 = mapToPoint(e1);
    const p = mcl.add(p0, p1);
    p.normalize();
    return p;
}

function mapToPoint(e0) {
    let e1 = new mcl.Fp();
    e1.setStr(e0.mod(FIELD_ORDER).toString());
    return e1.mapToG1();
}

function toBigEndian(p) {
    return p.serialize().reverse();
}

function g2() {
    const g2 = new mcl.G2();
    g2.setStr(
        "1 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa 0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b"
    );
    return g2;
}

function negativeG2() {
    const g2 = new mcl.G2();
    g2.setStr(
        "1 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2 0x1d9befcd05a5323e6da4d435f3b617cdb3af83285c2df711ef39c01571827f9d 0x275dc4a288d1afb3cbb1ac09187524c7db36395df7be3b99e673b13a075a65ec"
    );
    return g2;
}

function serializeSecret(secret) {
    return secret.serialize().reverse()
}

function g1ToHex(p) {
    p.normalize();
    const x = hexlify(toBigEndian(p.getX()));
    const y = hexlify(toBigEndian(p.getY()));
    return [x, y];
}

function g2ToHex(p) {
    p.normalize();
    const x = toBigEndian(p.getX());
    const x0 = hexlify(x.slice(32));
    const x1 = hexlify(x.slice(0, 32));
    const y = toBigEndian(p.getY());
    const y0 = hexlify(y.slice(32));
    const y1 = hexlify(y.slice(0, 32));
    return [x0, x1, y0, y1];
}

function sign(
    message,
    secret,
    domain
) {
    const message_point = hashToPoint(message, domain);
    const signature = mcl.mul(message_point, secret);
    signature.normalize();
    return { signature, message_point };
}

function verify(
    signature,
    pubkey,
    message
) {
    const negG2 = new mcl.PrecomputedG2(negativeG2());

    const pairings = mcl.precomputedMillerLoop2mixed(
        message,
        pubkey,
        signature,
        negG2
    );
    negG2.destroy();
    return mcl.finalExp(pairings).isOne();
}


function stringToUint8Array(str) {
    return Uint8Array.from(Buffer.from(str, "utf8"));
}

function hexToUint8Array(h) {
    return Uint8Array.from(Buffer.from(h.slice(2), "hex"));
}

function getPublicKey(secret) {
    let pub_key = mcl.mul(g2(), secret);
    pub_key.normalize();
    return pub_key
}

function randHex(num) {
    return hexlify(randomBytes(num))
}

function getKeyPairBySeed(str) {
    let r = hexlify(stringToUint8Array(str));
    let fr = new mcl.Fr();
    fr.setHashOf(r);
    return {
        secret: fr,
        public_key: getPublicKey(fr)
    }
}

function getRandomKeyPair(str) {
    r = randHex(13);
    return getKeyPairBySeed(r)
}

module.exports = {
    stringToUint8Array,
    hexToUint8Array,
    g1ToHex,
    g2ToHex,
    verify,
    getKeyPairBySeed,
    sign,
    serializeSecret
};
