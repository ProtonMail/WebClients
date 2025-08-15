import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString, binaryStringToArray, hexStringToArray } from '@proton/crypto/lib/utils';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { FetchedSignedKeyList } from '@proton/shared/lib/interfaces';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { KT_DOMAINS, KT_LEN, LEFT_N, vrfHexKeyDev, vrfHexKeyProd } from '../constants/constants';
import { getBaseDomain, throwKTError } from '../helpers/utils';
import type { Proof } from '../interfaces';
import { KTPROOF_TYPE } from '../interfaces';
import { vrfVerify } from './vrf';

/**
 * Pick the correct VRF key based on the domain
 */
const getVRFKey = () => hexStringToArray(getBaseDomain() === KT_DOMAINS.PROD ? vrfHexKeyProd : vrfHexKeyDev);

/**
 * Verify the VRF proof given by the server for a specific email address
 */
const verifyVRFProof = async (proof: Proof, email: string) => {
    try {
        const vrfHash = await vrfVerify(
            binaryStringToArray(canonicalizeInternalEmail(email)),
            hexStringToArray(proof.Verifier),
            getVRFKey()
        );
        return vrfHash;
    } catch (error: any) {
        const isProxyError = error instanceof Error && error.message.includes('CryptoProxy: endpoint not initialized');
        if (isProxyError) {
            throw error;
        }
        return throwKTError('VRF proof verification failed', { email, verifier: proof.Verifier, cause: error });
    }
};

const getMerkleTreePath = (vrfHash: Uint8Array<ArrayBuffer>, revision: number): Uint8Array<ArrayBuffer> => {
    return mergeUint8Arrays([
        vrfHash.subarray(0, 28),
        new Uint8Array([revision >>> 24, revision >>> 18, revision >>> 8, revision]),
    ]);
};

/**
 * Verify the given leafValue exists in the provided chain of the Merkle Tree.
 * The leafValue defaults to the empty node if not provided, which is used in
 * Proofs of Absence. The incompleteHashing parameter informs whether to start
 * hashing only after the first non-null neighbor or from the very beginning
 */
const verifyNeighbors = async (
    Neighbors: (string | null)[],
    TreeHash: string,
    vrfHash: Uint8Array<ArrayBuffer>,
    email: string,
    revision: number,
    proofType: KTPROOF_TYPE,
    leafValue: Uint8Array<ArrayBuffer> = new Uint8Array(KT_LEN).fill(0),
    incompleteHashing: boolean = true
) => {
    if (Neighbors.length !== KT_LEN * 8) {
        return throwKTError('Inconsistent number of neighbors', {
            neighborsLength: Neighbors.length,
        });
    }

    const key = getMerkleTreePath(vrfHash, revision);
    const emptyNode = new Uint8Array(KT_LEN);

    let startHashing = false;
    for (let i = Neighbors.length - 1; i >= 0; i--) {
        const neighborToCheck = Neighbors[i];
        // Don't hash as long as initial neighbours are null, but only if incompleteHashing
        // is set to true
        if (incompleteHashing && !startHashing && neighborToCheck === null) {
            continue;
        }
        startHashing = true;

        const bit = (key[Math.floor(i / 8)] >>> (8 - (i % 8) - 1)) & 1;
        let neighbor = emptyNode;
        if (neighborToCheck !== null) {
            neighbor = hexStringToArray(neighborToCheck);
        }

        const toHash =
            bit === LEFT_N ? mergeUint8Arrays([neighbor, leafValue]) : mergeUint8Arrays([leafValue, neighbor]);
        leafValue = await CryptoProxy.computeHash({
            algorithm: 'SHA256',
            data: toHash,
        });
    }

    if (arrayToHexString(leafValue) !== TreeHash) {
        return throwKTError('Hash chain does not result in TreeHash', {
            Neighbors: JSON.stringify(Neighbors),
            TreeHash,
            vrfHash: arrayToHexString(vrfHash),
            leafValue: arrayToHexString(leafValue),
            incompleteHashing,
            email,
            proofType,
            revision,
        });
    }
};

/**
 * Verify an address is not in KT by checking the Merkle Tree from the leaf 00...000. It only
 * starts hashing from the first non-null neighbour from the bottom of the tree
 */
export const verifyProofOfAbsenceForRevision = async (
    proof: Proof,
    email: string,
    TreeHash: string,
    Revision: number
) => {
    if (proof.Type !== KTPROOF_TYPE.ABSENCE) {
        return throwKTError('Proof type should be of absence', {
            email,
            proofType: proof.Type,
        });
    }
    const vrfHash = await verifyVRFProof(proof, email);
    return verifyNeighbors(proof.Neighbors, TreeHash, vrfHash, email, Revision, proof.Type);
};

/**
 * Verify an address is not in KT by checking the Merkle Tree from the leaf 00...000. It only
 * starts hashing from the first non-null neighbour from the bottom of the tree
 *
 */
export const verifyProofOfAbsenceForAllRevision = async (proof: Proof, email: string, TreeHash: string) => {
    await verifyProofOfAbsenceForRevision(proof, email, TreeHash, 0);
    proof.Neighbors.slice(224).forEach((neighbor) => {
        if (neighbor != null) {
            return throwKTError('Revision subtree is not empty', {
                Neighbors: JSON.stringify(proof.Neighbors),
            });
        }
    });
};

/**
 * Compute the leaf value as the SHA256 of the concatenation of the content,
 * either an obsolescence token or a SKL's data, and the revision
 */
const computeLeafValue = async (content: Uint8Array<ArrayBuffer>, minEpochID: number): Promise<Uint8Array<ArrayBuffer>> => {
    return CryptoProxy.computeHash({
        algorithm: 'SHA256',
        data: mergeUint8Arrays([
            await CryptoProxy.computeHash({
                algorithm: 'SHA256',
                data: content,
            }),
            new Uint8Array([minEpochID >>> 24, minEpochID >>> 16, minEpochID >>> 8, minEpochID]),
        ]),
    });
};

/**
 * Verify proof of obscolescence, i.e. with an ObsolescenceToken instead of a SKL. This also
 * entails to verifying that the server didn't place a valid SKL in the ObsolescenceToken field
 */
export const verifyProofOfObsolescence = async (
    proof: Proof,
    email: string,
    TreeHash: string,
    signedKeyList: Partial<FetchedSignedKeyList>
) => {
    const { Type } = proof;
    if (Type !== KTPROOF_TYPE.OBSOLESCENCE) {
        return throwKTError('Proof type should be of obsolescence', {
            email,
            proofType: Type,
        });
    }
    const { ObsolescenceToken, MinEpochID, Revision } = signedKeyList;
    if (!ObsolescenceToken || !MinEpochID || !Revision) {
        return throwKTError('Obsolescence proof with incomplete information', {
            email,
            signedKeyList,
        });
    }
    if (!/^[a-f0-9]+$/.test(ObsolescenceToken)) {
        return throwKTError('ObsolescenceToken should be an hex string', {
            email,
            ObsolescenceToken,
        });
    }
    const vrfHash = await verifyVRFProof(proof, email);
    const leafValue = await computeLeafValue(binaryStringToArray(ObsolescenceToken), MinEpochID);

    await verifyNeighbors(proof.Neighbors, TreeHash, vrfHash, email, Revision, proof.Type, leafValue, false);
};

/**
 * Verify the KT proof given by the server for a specific email address
 */
export const verifyProofOfExistence = async (
    proof: Proof,
    email: string,
    TreeHash: string,
    signedKeyList: Partial<FetchedSignedKeyList>
) => {
    const { Type } = proof;
    if (Type !== KTPROOF_TYPE.EXISTENCE) {
        return throwKTError('Proof type should be of existence', {
            email,
            proofType: Type,
        });
    }
    const { Data, MinEpochID, Revision } = signedKeyList;
    if (!Data || !MinEpochID || !Revision) {
        return throwKTError('Existence proof with incomplete information', {
            email,
            signedKeyList,
        });
    }
    const vrfHash = await verifyVRFProof(proof, email);
    const leafValue = await computeLeafValue(binaryStringToArray(Data), MinEpochID);

    await verifyNeighbors(proof.Neighbors, TreeHash, vrfHash, email, Revision, proof.Type, leafValue, false);
};

export const verifyProofOfExistenceOrObsolescence = async (
    proof: Proof,
    email: string,
    TreeHash: string,
    signedKeyList: Partial<FetchedSignedKeyList>
) => {
    if (proof.Type === KTPROOF_TYPE.EXISTENCE) {
        await verifyProofOfExistence(proof, email, TreeHash, signedKeyList);
    } else if (proof.Type === KTPROOF_TYPE.OBSOLESCENCE) {
        await verifyProofOfObsolescence(proof, email, TreeHash, signedKeyList);
    } else {
        return throwKTError('Proof type should be of existence or obsolescence', {
            email,
            proofType: proof.Type,
        });
    }
};
