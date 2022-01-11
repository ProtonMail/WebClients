import {
    verifyMessage,
    OpenPGPKey,
    getSHA256Fingerprints,
    getKeys,
    VERIFICATION_STATUS,
    getSignature,
    createMessage,
    OpenPGPSignature,
} from 'pmcrypto';
import { enums } from 'openpgp';
import { Api, SignedKeyListEpochs } from '@proton/shared/lib/interfaces';
import { getItem, hasStorage, removeItem } from '@proton/shared/lib/helpers/storage';
import { Epoch, EpochExtended, KeyInfo } from './interfaces';
import { fetchProof, fetchEpoch } from './fetchHelper';
import { checkAltName, verifyLEcert, verifySCT, parseCertChain } from './certTransparency';
import { verifyProof, verifyChainHash } from './merkleTree';
import { MAX_EPOCH_INTERVAL } from './constants';

/**
 * Check whether the metadata of a key matches what is stored in the Signed Key List
 */
export const compareKeyInfo = (keyInfo: KeyInfo, sklKeyInfo: KeyInfo) => {
    // Check fingerprints
    if (keyInfo.Fingerprint !== sklKeyInfo.Fingerprint) {
        throw new Error('Fingerprints');
    }

    // Check SHA256Fingerprints
    if (keyInfo.SHA256Fingerprints.length !== sklKeyInfo.SHA256Fingerprints.length) {
        throw new Error('SHA256Fingerprints length');
    }
    keyInfo.SHA256Fingerprints.forEach((sha256Fingerprint, i) => {
        if (sha256Fingerprint !== sklKeyInfo.SHA256Fingerprints[i]) {
            throw new Error('SHA256Fingerprints');
        }
    });

    // Check Flags
    if (keyInfo.Flags !== sklKeyInfo.Flags) {
        throw new Error('Flags');
    }

    // Check primariness
    if (keyInfo.Primary !== sklKeyInfo.Primary) {
        throw new Error('Primariness');
    }
};

/**
 * Check that a list of keys is correctly represented by a Signed Key List
 */
export const verifyKeyLists = async (
    keyList: {
        Flags: number;
        PublicKey: OpenPGPKey;
    }[],
    signedKeyListData: KeyInfo[]
) => {
    // Check arrays validity
    if (keyList.length === 0) {
        throw new Error('No keys detected');
    }
    if (keyList.length !== signedKeyListData.length) {
        throw new Error('Key list and signed key list have different lengths');
    }

    // Prepare key lists
    const keyListInfo = await Promise.all(
        keyList.map(async (key, i) => {
            return {
                Fingerprint: key.PublicKey.getFingerprint().toLowerCase(),
                SHA256Fingerprints: (await getSHA256Fingerprints(key.PublicKey)).map((sha256fingerprint: string) =>
                    sha256fingerprint.toLowerCase()
                ),
                Primary: i === 0 ? 1 : 0,
                Flags: key.Flags,
            };
        })
    );
    keyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });

    const signedKeyListInfo = signedKeyListData.map((keyInfo) => {
        return {
            ...keyInfo,
            Fingerprint: keyInfo.Fingerprint.toLowerCase(),
            SHA256Fingerprints: keyInfo.SHA256Fingerprints.map((sha256fingerprint: string) =>
                sha256fingerprint.toLowerCase()
            ),
        };
    });
    signedKeyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });

    // Check keys
    keyListInfo.forEach((key, i) => {
        compareKeyInfo(key, signedKeyListInfo[i]);
    });
};

/**
 * Verify that the Signed Key List of an email address is correctly stored in an epoch
 */
export const verifyEpoch = async (epoch: Epoch, email: string, signedKeyListArmored: string, api: Api) => {
    // Fetch and verify proof
    const proof = await fetchProof(epoch.EpochID, email, api);
    await verifyProof(proof, epoch.TreeHash, signedKeyListArmored, email);

    // Verify ChainHash
    await verifyChainHash(epoch.TreeHash, epoch.PrevChainHash, epoch.ChainHash);

    // Parse and verify certificates
    const certChain = parseCertChain(epoch.Certificate);
    const epochCert = certChain[0];
    const issuerCert = certChain[1];
    await verifyLEcert(certChain);
    checkAltName(epochCert, epoch.ChainHash);
    await verifySCT(epochCert, issuerCert);

    let returnedDate: number;
    switch (epochCert.notBefore.type) {
        case 0:
        case 1:
            returnedDate = epochCert.notBefore.value.getTime();
            break;
        default:
            throw new Error(`Certificate's notBefore date is invalid (type = ${epochCert.notBefore.type})`);
    }

    return returnedDate;
};

/**
 * Parse a key list and the associated Signed Key List
 */
export const parseKeyLists = async (
    keyList: {
        Flags: number | undefined;
        PublicKey: string;
    }[],
    signedKeyListData: string
): Promise<{
    signedKeyListData: KeyInfo[];
    parsedKeyList: { Flags: number; PublicKey: OpenPGPKey }[];
}> => {
    return {
        signedKeyListData: JSON.parse(signedKeyListData),
        parsedKeyList: await Promise.all(
            keyList.map(async (key) => {
                return {
                    Flags: key.Flags ? key.Flags : 0,
                    PublicKey: (await getKeys(key.PublicKey))[0],
                };
            })
        ),
    };
};

/**
 * Verified the detached signature of a message
 */
export const checkSignature = async (
    message: string,
    publicKeys: OpenPGPKey[],
    signature: string,
    failMessage: string
) => {
    const { verified } = await verifyMessage({
        message: createMessage(message),
        publicKeys,
        signature: await getSignature(signature),
    });
    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        throw new Error(`Signature verification failed (${failMessage})`);
    }
};

/**
 * Extract the timestamp from a signature
 */
export const getSignatureTime = (signature: OpenPGPSignature): number => {
    const packet = signature.packets.findPacket(enums.packet.signature);
    if (!packet) {
        throw new Error('Signature contains no signature packet');
    }
    return (packet as any).created.getTime();
};

/**
 * Check whether a timestamp is older than am hardcoded treshold
 */
export const isTimestampTooOld = (time: number, refereceTime?: number) => {
    if (!refereceTime) {
        refereceTime = Date.now();
    }
    return Math.abs(refereceTime - time) > MAX_EPOCH_INTERVAL;
};

/**
 * Verify the latest epoch
 */
export const verifyCurrentEpoch = async (
    signedKeyList: SignedKeyListEpochs,
    email: string,
    api: Api
): Promise<EpochExtended> => {
    const currentEpoch = await fetchEpoch(signedKeyList.MaxEpochID as number, api);

    const returnedDate: number = await verifyEpoch(currentEpoch, email, signedKeyList.Data, api);

    if (isTimestampTooOld(returnedDate)) {
        throw new Error('Returned date is older than MAX_EPOCH_INTERVAL');
    }

    const { Revision }: { Revision: number } = await fetchProof(currentEpoch.EpochID, email, api);

    return {
        ...currentEpoch,
        Revision,
        CertificateDate: returnedDate,
    } as EpochExtended;
};

/**
 * Helper to get all KT-related blobs from localStorage for a given address
 */
export const getKTBlobs = (addressID: string) => {
    const returnedMap: Map<string, string> = new Map();

    if (!hasStorage()) {
        return returnedMap;
    }

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) {
            continue;
        }
        const splitKey = key.split(':');
        if (splitKey[0] === 'kt' && splitKey[2] === addressID) {
            returnedMap.set(key, getItem(key) as string);
        }
    }

    return returnedMap;
};

/**
 * Get all KT-related blobs from localStorage for a given address
 */
export const getFromLS = (addressID: string): string[] => {
    if (!hasStorage()) {
        return [];
    }

    const ktBlobs = getKTBlobs(addressID);

    const values: string[] = [];
    for (const element of ktBlobs) {
        const [key, value] = element;
        const splitKey = key.split(':');
        values[parseInt(splitKey[1], 10)] = value;
    }

    return values;
};

/**
 * Remove a specific KT blob from localStorage
 */
export const removeFromLS = (index: number, addressID: string) => {
    if (!hasStorage()) {
        throw new Error('localStorage unavailable');
    }

    const ktBlobs = getKTBlobs(addressID);

    let removed = false;
    for (const element of ktBlobs) {
        const [key] = element;
        const splitKey = key.split(':');
        if (splitKey[1] === `${index}`) {
            removeItem(key);
            removed = true;
            break;
        }
    }

    if (!removed) {
        throw new Error('Cannot remove blob from localStorage');
    }
};
