import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString, binaryStringToArray, concatArrays, hexStringToArray } from '@proton/crypto/lib/utils';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Api, FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { KT_DOMAINS, KT_LEN, LEFT_N, vrfHexKeyDev, vrfHexKeyProd } from '../constants/constants';
import { fetchProof, fetchRecentEpoch } from '../helpers/fetchHelpers';
import { getBaseDomain, ktSentryReport } from '../helpers/utils';
import { Epoch, KTPROOF_TYPE, Proof } from '../interfaces';
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
        ktSentryReport(error.message, { context: 'verifyVRFProof', email, verifier: proof.Verifier });
        throw new Error(error.message);
    }
};

/**
 * Verify the given leafValue exists in the provided chain of the Merkle Tree.
 * The leafValue defaults to the empty node if not provided, which is used in
 * Proofs of Abscence. The incompleteHashing parameter informs whether to start
 * hashing only after the first non-null neighbor or from the very beginning
 */
const verifyNeighbors = async (
    Neighbors: (string | null)[],
    TreeHash: string,
    vrfHash: Uint8Array,
    leafValue: Uint8Array = new Uint8Array(KT_LEN).fill(0),
    incompleteHashing: boolean = true
) => {
    if (Neighbors.length !== KT_LEN * 8) {
        ktSentryReport('Inconsistent number of neighbors', {
            context: 'verifyNeighbors',
            neighborsLength: Neighbors.length,
        });
        throw new Error('Inconsistent number of neighbors');
    }

    const key = vrfHash.subarray(0, KT_LEN);
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

        const toHash = bit === LEFT_N ? concatArrays([neighbor, leafValue]) : concatArrays([leafValue, neighbor]);
        leafValue = await CryptoProxy.computeHash({
            algorithm: 'SHA256',
            data: toHash,
        });
    }

    if (arrayToHexString(leafValue) !== TreeHash) {
        ktSentryReport('Hash chain does not result in TreeHash', {
            context: 'verifyNeighbors',
            Neighbors: JSON.stringify(Neighbors),
            TreeHash,
            vrfHash: arrayToHexString(vrfHash),
            leafValue: arrayToHexString(leafValue),
            incompleteHashing,
        });
        throw new Error('Hash chain does not result in TreeHash');
    }
};

/**
 * Verify an address is not in KT by checking the Merkle Tree from the leaf 00...000. It only
 * starts hashing from the first non-null neighbour from the bottom of the tree
 */
const verifyProofOfAbscence = async (proof: Proof, email: string, TreeHash: string) => {
    const vrfHash = await verifyVRFProof(proof, email);
    return verifyNeighbors(proof.Neighbors, TreeHash, vrfHash);
};

/**
 * Compute the leaf value as the SHA256 of the concatenation of the content,
 * either an obsolescence token or a SKL's data, and the revision
 */
const computeLeafValue = async (content: Uint8Array, Revision: number) =>
    CryptoProxy.computeHash({
        algorithm: 'SHA256',
        data: concatArrays([
            await CryptoProxy.computeHash({
                algorithm: 'SHA256',
                data: content,
            }),
            new Uint8Array([Revision >>> 24, Revision >>> 16, Revision >>> 8, Revision]),
        ]),
    });

/**
 * Verify proof of obscolescence, i.e. with an ObsolescenceToken instead of a SKL. This also
 * entails to verifying that the server didn't place a valid SKL in the ObsolescenceToken field
 */
const verifyProofOfObsolescence = async (proof: Proof, email: string, TreeHash: string, ObsolescenceToken: string) => {
    const { Type, Revision } = proof;
    if (Type !== KTPROOF_TYPE.OBSOLESCENCE) {
        ktSentryReport('Proof type should be of obsolescence', {
            context: 'verifyProofOfObsolescence',
            proofType: Type,
        });
        throw new Error('Proof type should be of obsolescence');
    }
    if (!/^[a-f0-9]+$/.test(ObsolescenceToken)) {
        ktSentryReport('ObsolescenceToken should be an hex string', {
            context: 'verifyProofOfObsolescence',
            ObsolescenceToken,
        });
        throw new Error('ObsolescenceToken should be an hex string');
    }

    const vrfHash = await verifyVRFProof(proof, email);
    const leafValue = await computeLeafValue(binaryStringToArray(ObsolescenceToken), Revision);

    await verifyNeighbors(proof.Neighbors, TreeHash, vrfHash, leafValue, false);
};

/**
 * Verify the KT proof given by the server for a specific email address
 */
const verifyProofOfExistence = async (proof: Proof, email: string, TreeHash: string, sklData: string) => {
    const { Type, Revision } = proof;
    if (Type !== KTPROOF_TYPE.EXISTENCE) {
        ktSentryReport('Proof type should be of existence', {
            context: 'verifyProofOfExistence',
            proofType: Type,
        });
        throw new Error('Proof type should be of existence');
    }

    const vrfHash = await verifyVRFProof(proof, email);
    const leafValue = await computeLeafValue(binaryStringToArray(sklData), Revision);

    await verifyNeighbors(proof.Neighbors, TreeHash, vrfHash, leafValue, false);
};

/**
 * Verify that a proof of abscence exists and is correctly verified. This is
 * useful in scenarios where some actions on the keys can legitimately be
 * performed only if an address has never been in KT before, e.g. key upgrade
 * and key migration. If such actions, which can be triggered by the server,
 * are performed over addresses already in KT, they are considered to be malicious
 */
export const verifyPoAExistence = async (api: Api, email: string) => {
    const epoch = await fetchRecentEpoch(api);
    if (!epoch) {
        return;
    }

    const { Proof } = await fetchProof(epoch.EpochID, email, api);

    if (Proof.Type !== KTPROOF_TYPE.ABSENCE) {
        ktSentryReport('Proof type should be of abscence', {
            context: 'verifyPoAExistence',
            proofType: Proof.Type,
        });
        return;
    }

    try {
        await verifyProofOfAbscence(Proof, email, epoch.TreeHash);
    } catch (error: any) {
        // Since this function is used inside the apps directly, we shouldn't let
        // it throw nor, for the time being of UI-less KT, trigger anything
        ktSentryReport('Proof of abscence verification failed', {
            context: 'verifyPoAExistence',
        });
    }
};

/**
 * Verify the absence proof of an email address for which no Signed Key List was provided.
 * Because a SKL is provided even for obsolescent catchall, the case where none is given
 * at all can only mean that both the proof and the catchall proof must be of absence
 */
export const verifySKLAbsence = async (api: Api, email: string) => {
    const epoch = await fetchRecentEpoch(api);
    if (!epoch) {
        return;
    }

    const { Proof } = await fetchProof(epoch.EpochID, email, api);

    const { ObsolescenceToken, Type } = Proof;

    if (!!ObsolescenceToken || Type !== KTPROOF_TYPE.ABSENCE) {
        ktSentryReport('Proof type should be of abscence', {
            context: 'verifySKLAbsence',
            ObsolescenceToken,
            proofType: Type,
        });
        throw new Error('Proof type should be of abscence');
    }
    return verifyProofOfAbscence(Proof, email, epoch.TreeHash);

    /* Ignore CatchAllProof for the time being
    if (!CatchAllProof) {
        ktSentryReport('CatchAllProof must exist', {
            context: 'verifySKLAbsence',
        });
        throw new Error('CatchAllProof must exist');
    }

    const { ObsolescenceToken: CatchAllToken, Type: CatchAllType } = CatchAllProof;
    const domain = getEmailDomain(email);

    if (!!CatchAllToken || CatchAllType !== KTPROOF_TYPE.ABSENCE) {
        ktSentryReport('CatchAllProof type should be of abscence', {
            context: 'verifySKLAbsence',
            CatchAllToken,
            CatchAllType,
        });
        throw new Error('CatchAllProof type should be of abscence');
    }
    return verifyProofOfAbscence(CatchAllProof, domain, epoch.TreeHash);
    */
};

/**
 * Verify the existence or obsolescence proofs, either its own or its catchall's, of
 * an email address for which a Signed Key List was provided
 */
export const verifySKLExistence = async (
    api: Api,
    epoch: Epoch,
    email: string,
    signedKeyList: FetchedSignedKeyList
) => {
    const { Proof, CatchAllProof } = await fetchProof(epoch.EpochID, email, api);

    const { ObsolescenceToken, Type, Revision } = Proof;

    if (ObsolescenceToken) {
        if (Type !== KTPROOF_TYPE.OBSOLESCENCE) {
            ktSentryReport('Proof type should be of obsolescence', {
                context: 'verifySKLExistence',
                proofType: Type,
            });
            throw new Error('Proof type should be of obsolescence');
        }
        await verifyProofOfObsolescence(Proof, email, epoch.TreeHash, ObsolescenceToken);
    } else {
        if (Type !== KTPROOF_TYPE.EXISTENCE || !signedKeyList.Data || !signedKeyList.Signature || !!CatchAllProof) {
            ktSentryReport('Proof type should be of existence', {
                context: 'verifySKLExistence',
                signedKeyList: JSON.stringify(signedKeyList),
                CatchAllProof,
                proofType: Type,
            });
            throw new Error('Proof type should be of existence');
        }
        await verifyProofOfExistence(Proof, email, epoch.TreeHash, signedKeyList.Data);

        return { Revision, ObsolescenceToken };
    }

    /* Ignore CatchAllProof for the time being
    if (!CatchAllProof) {
        ktSentryReport('CatchAllProof must exist', {
            context: 'verifySKLExistence',
        });
        throw new Error('CatchAllProof must exist');
    }

    const { ObsolescenceToken: CatchAllToken, Type: CatchAllType } = CatchAllProof;
    const domain = getEmailDomain(email);

    if (CatchAllToken) {
        if (CatchAllType !== KTPROOF_TYPE.OBSOLESCENCE) {
            ktSentryReport('CatchAllProof type should be of obsolescence', {
                context: 'verifySKLExistence',
                catchallProofType: CatchAllType,
            });
            throw new Error('CatchAllProof type should be of obsolescence');
        }
        await verifyProofOfObsolescence(CatchAllProof, domain, epoch.TreeHash, CatchAllToken);

        return { Revision, ObsolescenceToken };
    }

    if (CatchAllType !== KTPROOF_TYPE.ABSENCE) {
        ktSentryReport('CatchAllProof type should be of abscence', {
            context: 'verifySKLExistence',
            catchallProofType: CatchAllType,
        });
        throw new Error('CatchAllProof type should be of abscence');
    }
    await verifyProofOfAbscence(CatchAllProof, domain, epoch.TreeHash);
    */

    return { Revision, ObsolescenceToken };
};
