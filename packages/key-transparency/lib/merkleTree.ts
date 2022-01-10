import { SHA256, arrayToHexString, concatArrays, binaryStringToArray } from 'pmcrypto';
import { vrfVerify } from './vrf';
import { Proof } from './interfaces';
import { KT_LEN, LEFT_N, vrfHexKey } from './constants';

/**
 * Convert a string of hexadecimal numbers into a byte array
 */
const hexStringToArray = (hex: string): Uint8Array => {
    const result = new Uint8Array(hex.length >> 1);
    for (let k = 0; k < hex.length >> 1; k++) {
        result[k] = parseInt(hex.substring(k << 1, (k << 1) + 2), 16);
    }
    return result;
};

/**
 * Verify the chain hash of an epoch
 */
export const verifyChainHash = async (TreeHash: string, PreviousChainHash: string, ChainHash: string) => {
    if (ChainHash !== arrayToHexString(await SHA256(hexStringToArray(`${PreviousChainHash}${TreeHash}`)))) {
        throw new Error('Chain hash of fetched epoch is not consistent');
    }
};

/**
 * Verify the KT proof given by the server for a specific email address
 */
export const verifyProof = async (proof: Proof, TreeHash: string, sklData: string, email: string) => {
    if (proof.Neighbors.length !== KT_LEN * 8) {
        throw new Error('Inconsistent number of neighbors');
    }

    // Verify proof
    let vrfHash: Uint8Array;
    try {
        vrfHash = await vrfVerify(
            binaryStringToArray(email),
            hexStringToArray(proof.Proof),
            hexStringToArray(vrfHexKey)
        );
    } catch (error: any) {
        throw new Error(`VRF verification failed with error "${error.message}"`);
    }

    // Parse proof and verify epoch against proof
    let val = await SHA256(
        concatArrays([
            await SHA256(binaryStringToArray(sklData)),
            new Uint8Array([proof.Revision >>> 24, proof.Revision >>> 16, proof.Revision >>> 8, proof.Revision]),
        ])
    );
    const emptyNode = new Uint8Array(KT_LEN);
    const key = vrfHash.subarray(0, KT_LEN);

    for (let i = proof.Neighbors.length - 1; i >= 0; i--) {
        const bit = (key[Math.floor(i / 8)] >>> (8 - (i % 8) - 1)) & 1;
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
};
