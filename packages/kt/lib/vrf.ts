import BN from 'bn.js';
import * as elliptic from 'elliptic';
import { SHA256, concatArrays } from 'pmcrypto';

type Point = elliptic.curve.base.BasePoint;
/* eslint-disable new-cap */
const EDDSA = new elliptic.eddsa('ed25519');
/* eslint-enable new-cap */
const N2 = 32;
const PROOF_SIZE = 48;
const N = N2 / 2;
const G = EDDSA.curve.g as Point;
const LIMIT = 100;
const CO_FACTOR = 8;

function OS2ECP(os: Uint8Array) {
    try {
        return EDDSA.decodePoint(elliptic.utils.toArray(os, 16)) as Point;
    } catch (e) {
        return null;
    }
}

function S2OS(os: number[]) {
    const sign = os[31] >>> 7;
    os.unshift(sign + 2);
    return Uint8Array.from(os);
}

function ECP2OS(P: Point) {
    return S2OS([...EDDSA.encodePoint(P)]);
}

function OS2IP(os: Uint8Array) {
    return new BN(os);
}

function I2OSP(i: BN, len?: number) {
    return Uint8Array.from(i.toArray('be', len));
}

function decodeProof(proof: Uint8Array) {
    let pos = 0;
    const sign = proof[pos++];
    if (sign !== 2 && sign !== 3) {
        return;
    }
    const r = OS2ECP(proof.slice(pos, pos + N2));
    if (!r) {
        return;
    }
    pos += N2;
    const c = proof.slice(pos, pos + N);
    pos += N;
    const s = proof.slice(pos, pos + N2);
    return { r, c: OS2IP(c), s: OS2IP(s) };
}

async function hashToCurve(email: Uint8Array, publicKey: Uint8Array): Promise<any> {
    for (let i = 0; i < LIMIT; i++) {
        const ctr = I2OSP(new BN(i), 4);
        const digest = Uint8Array.from(
            await SHA256(concatArrays([new Uint8Array(email), new Uint8Array(publicKey), new Uint8Array(ctr)]))
        );

        let point = OS2ECP(digest);
        if (point) {
            for (let j = 1; j < CO_FACTOR; j *= 2) {
                point = point.add(point);
            }
            return point;
        }
    }
    return null;
}

async function hashPoints(...args: Point[]) {
    let hash = new Uint8Array();
    for (let i = 0; i < args.length; i++) {
        hash = concatArrays([hash, new Uint8Array(ECP2OS(args[i]))]);
    }
    const digest = Uint8Array.from(await SHA256(hash));
    return OS2IP(digest.slice(0, N));
}

const arrayEquality = (a: Uint8Array, b: Uint8Array) => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

export async function vrfVerify(publicKey: Uint8Array, email: Uint8Array, proof: Uint8Array, value: Uint8Array) {
    if (proof.length !== N2 + PROOF_SIZE + 1 || value.length !== N2 || publicKey.length !== N2) {
        throw new Error('Length mismatch found');
    }
    if (!arrayEquality(value, proof.slice(1, N2 + 1))) {
        throw new Error('Fetched name is different than name in proof');
    }
    const o = decodeProof(proof);
    if (!o) {
        throw new Error('Proof decoding failed');
    }
    const P1 = OS2ECP(publicKey);
    if (!P1) {
        throw new Error('VRF public key parsing failed');
    }
    const u = P1.mul(o.c).add(G.mul(o.s));
    const h = await hashToCurve(email, publicKey);
    if (!h) {
        throw new Error('Point generation failed');
    }
    const v = o.r.mul(o.c).add(h.mul(o.s));
    const c = await hashPoints(G, h, P1, o.r, u, v);
    if (!c.eq(o.c)) {
        throw new Error('Verification went through but failed');
    }
}
