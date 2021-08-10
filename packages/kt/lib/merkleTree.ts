import { SHA256, arrayToHexString, concatArrays, binaryStringToArray } from 'pmcrypto';
import { vrfVerify } from './vrf';
import { vrfHexKey } from './constants';
import { Proof } from './interfaces';

const LEFT_N = 1; // left neighbor

function hexStringToArray(hex: string): Uint8Array {
    const result = new Uint8Array(hex.length >> 1);
    for (let k = 0; k < hex.length >> 1; k++) {
        result[k] = parseInt(hex.substr(k << 1, 2), 16);
    }
    return result;
}

export async function verifyChainHash(TreeHash: string, PreviousChainHash: string, ChainHash: string) {
    if (ChainHash !== arrayToHexString(await SHA256(hexStringToArray(`${PreviousChainHash}${TreeHash}`)))) {
        throw new Error('Chain hash of fetched epoch is not consistent');
    }
}

export async function verifyProof(proof: Proof, TreeHash: string, sklData: string, email: string) {
    // Verify proof
    try {
        await vrfVerify(
            hexStringToArray(vrfHexKey),
            binaryStringToArray(email),
            hexStringToArray(proof.Proof),
            hexStringToArray(proof.Name)
        );
    } catch (err) {
        throw new Error(`VRF verification failed with error "${err.message}"`);
    }

    // Parse proof and verify epoch against proof
    let val = await SHA256(
        concatArrays([
            await SHA256(binaryStringToArray(sklData)),
            new Uint8Array([proof.Revision >>> 24, proof.Revision >>> 16, proof.Revision >>> 8, proof.Revision]),
        ])
    );
    const emptyNode = new Uint8Array(32);
    const key = hexStringToArray(proof.Name);

    for (let i = proof.Neighbors.length - 1; i >= 0; i--) {
        const bit = (key[Math.floor(i / 8) % 32] >>> (8 - (i % 8) - 1)) & 1;
        let neighbor = emptyNode;
        const neighborToCheck = proof.Neighbors[i];
        if (neighborToCheck !== null) {
            neighbor = hexStringToArray(neighborToCheck);
        }
        const toHash = bit === LEFT_N ? concatArrays([neighbor, val]) : concatArrays([val, neighbor]);
        val = await SHA256(toHash);
    }

    if (arrayToHexString(val) !== TreeHash) {
        throw new Error('Hash chain does not result in TreeHash');
    }
}
