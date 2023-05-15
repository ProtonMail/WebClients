import { CryptoProxy, PrivateKeyReference, PublicKeyReference, serverTime } from '@proton/crypto';
import { Api, KTLocalStorageAPI } from '@proton/shared/lib/interfaces';

import { fetchLastSKL } from '../helpers/fetchHelpers';
import { ktSentryReport } from '../helpers/utils';
import { KTBlobContent, KTBlobValuesWithInfo, PartialKTBlobContent } from '../interfaces';

/**
 * Get all KT-related blobs from localStorage for the specified user
 * and decrypt them. If an addressID is specified, only those related
 * to it are returned
 */
export const getAllKTBlobValuesWithInfo = async (
    userID: string,
    userPrivateKeys: PrivateKeyReference[],
    ktLSAPI: KTLocalStorageAPI,
    addressID?: string
): Promise<Map<string, KTBlobValuesWithInfo>> => {
    const keys = await ktLSAPI.getBlobs();
    const ktBlobValuesWithInfoMap: Map<string, KTBlobValuesWithInfo> = new Map();

    for (const key of keys) {
        // Format is KT:{userID}:{addressID}
        const chunks = key.split(':');
        if (chunks.length !== 3) {
            continue;
        }
        const [ktTag, storedUserID, storedAddress] = chunks;

        if (ktTag !== 'KT' || storedUserID !== userID || (!!addressID && storedAddress !== addressID)) {
            continue;
        }

        const armoredMessage = await ktLSAPI.getItem(key);
        if (!armoredMessage) {
            ktSentryReport('No value found for an existing key', {
                context: 'getAllKTBlobValuesWithInfo',
            });
            throw new Error('No value found for an existing key');
        }

        const ktBlobsContent: KTBlobContent[] = JSON.parse(
            (
                await CryptoProxy.decryptMessage({
                    armoredMessage,
                    decryptionKeys: userPrivateKeys,
                })
            ).data
        );

        ktBlobValuesWithInfoMap.set(storedAddress, {
            userID,
            addressID: storedAddress,
            ktBlobsContent,
        });
    }

    return ktBlobValuesWithInfoMap;
};

/**
 * Generate a key name according to the KT format
 */
const generateKeyFullName = (userID: string, addressID: string) => `KT:${userID}:${addressID}`;

/**
 * Remove a specific KT blob from localStorage
 */
export const removeKTFromLS = async (userID: string, addressID: string, ktLSAPI: KTLocalStorageAPI) =>
    ktLSAPI.removeItem(generateKeyFullName(userID, addressID));

/**
 * Encrypt a spefic KT blob to localStorage
 */
export const encryptKTtoLS = async (
    ktBlobContentWithInfo: KTBlobValuesWithInfo,
    userPrimaryKey: PublicKeyReference,
    ktLSAPI: KTLocalStorageAPI
) => {
    const { userID, addressID, ktBlobsContent } = ktBlobContentWithInfo;

    const ciphertext = (
        await CryptoProxy.encryptMessage({
            textData: JSON.stringify(ktBlobsContent),
            encryptionKeys: userPrimaryKey,
        })
    ).message;

    return ktLSAPI.setItem(generateKeyFullName(userID, addressID), ciphertext);
};

/**
 * Commit changes to SKLs to local storage for later checking. Note
 * that there can be up to two such blobs, since changes within the
 * same epoch should be overwritten
 */
export const commitOwnKeystoLS = async (
    partialKTBlobContent: PartialKTBlobContent,
    userPrivateKeys: PrivateKeyReference[],
    api: Api,
    ktLSAPI: KTLocalStorageAPI,
    userID: string,
    addressID: string
) => {
    const { creationTimestamp, email } = partialKTBlobContent;

    const ktBlobsMap = await getAllKTBlobValuesWithInfo(userID, userPrivateKeys, ktLSAPI, addressID);
    const ktBlobsContent = ktBlobsMap.get(addressID)?.ktBlobsContent || [];

    const lastSKL = await fetchLastSKL(api, email);
    const { ExpectedMinEpochID } = lastSKL || {};

    if (!ExpectedMinEpochID) {
        ktSentryReport('Could not fetch ExpectedMinEpochID', {
            context: 'commitOwnKeystoLS',
            addressID,
        });
        return;
    }

    const ktBlobContent: KTBlobContent = {
        ...partialKTBlobContent,
        ExpectedMinEpochID,
    };

    switch (ktBlobsContent.length) {
        case 0:
            // No blobs for this user/address present means that we can safely
            // store the SKL under the 0 counter
            ktBlobsContent.push(ktBlobContent);
            break;
        case 1: {
            const [{ creationTimestamp: blobTimestamp }] = ktBlobsContent;

            if (!lastSKL) {
                // The lastSKL must exist because it was created when this LS blob was added
                ktSentryReport('Latest SKL from LS blob not returned', {
                    context: 'commitOwnKeystoLS',
                    addressID,
                });
                return;
            }

            if (lastSKL.MinEpochID === null) {
                // If the the latest stored SKL has MinEpochID equal to null, it means that it
                // hasn't been included in any epoch yet. This means that, for the upcoming epoch
                // generation, the SKL contained in the given ktBlobContent will be inserted in KT instead.
                // Therefore, the blob in LS should be overwritten but only if its timestamp is more
                // recent than the one stored in LS, otherwise a race condition might happen such that
                // a previous SKL is stored in LS after a more recent one
                if (!!blobTimestamp && !!creationTimestamp && blobTimestamp > creationTimestamp) {
                    return;
                }

                ktBlobsContent[0] = ktBlobContent;
            } else {
                // If, instead, the latest SKL has made its way into KT, the fact that it's also
                // in LS means that no self-audit has run since. The input SKL, then, should be
                // considered an extra one and not overwrite the blob in LS
                ktBlobsContent.push(ktBlobContent);
            }
            break;
        }
        case 2: {
            const [, newKTBlob] = ktBlobsContent;

            if (!lastSKL) {
                // The lastSKL must exist because it was created when this LS blob was added
                ktSentryReport('Latest SKL from LS blob not returned', {
                    context: 'commitOwnKeystoLS',
                    addressID,
                });
                return;
            }

            if (lastSKL.MinEpochID !== null) {
                // The new SKL cannot already be in KT, because it would mean that self-audit hasn't
                // run for more than EXP_EPOCH_INTERVAL while allowing the given SKL change
                ktSentryReport('Latest SKL from LS blob already in KT, self-audit must have not run', {
                    context: 'commitOwnKeystoLS',
                    addressID,
                });
                return;
            }

            // Because of the above, only counter=1 can be overwritten. As before, to avoid race conditions
            // it should happen only if the timestamp is actually greater
            if (
                !!newKTBlob.creationTimestamp &&
                !!creationTimestamp &&
                newKTBlob.creationTimestamp > creationTimestamp
            ) {
                return;
            }

            ktBlobsContent[1] = ktBlobContent;
            break;
        }
        default:
            ktSentryReport('There are too many KT blobs in localStorage', {
                context: 'commitOwnKeystoLS',
                addressID,
                ktBlobsContentlength: ktBlobsContent.length,
            });
            return;
    }

    return encryptKTtoLS(
        {
            userID,
            addressID,
            ktBlobsContent,
        },
        userPrivateKeys[0],
        ktLSAPI
    );
};

/**
 * Commit SKLs of other users to local storage for later checking. Note that
 * for others' keys there is no limit in the number of blobs we can store
 */
export const commitOthersKeystoLS = async (
    ktBlobContent: KTBlobContent,
    userPrivateKeys: PrivateKeyReference[],
    ktLSAPI: KTLocalStorageAPI,
    userID: string,
    addressID: string
) => {
    const { creationTimestamp } = ktBlobContent;

    const ktBlobsMap = await getAllKTBlobValuesWithInfo(userID, userPrivateKeys, ktLSAPI, addressID);
    const ktBlobsContent = ktBlobsMap.get(addressID)?.ktBlobsContent || [];

    if (ktBlobsContent.length) {
        const lastKTBlob = ktBlobsContent[ktBlobsContent.length - 1];

        if (creationTimestamp < lastKTBlob.creationTimestamp) {
            ktSentryReport('A new KT blob is older than one already stored', {
                context: 'commitOthersKeystoLS',
                ktBlobsContentlength: ktBlobsContent.length,
            });
            return;
        }

        // If the creation timestamps are the same, we are really talking
        // about the same SKL change, therefore there is no need to store
        // anything additional
        if (creationTimestamp === lastKTBlob.creationTimestamp) {
            return;
        }
    }

    ktBlobsContent.push(ktBlobContent);
    return encryptKTtoLS(
        {
            userID,
            addressID,
            ktBlobsContent,
        },
        userPrivateKeys[0],
        ktLSAPI
    );
};

/**
 * Generate a key name according to the KT format for self-audit
 */
const generateKeyAuditName = (userID: string) => `KT:${userID}:audit`;

/**
 * Store the last result of self-audit
 */
export const storeAuditResult = async (userID: string, ktLSAPI: KTLocalStorageAPI) =>
    ktLSAPI.setItem(generateKeyAuditName(userID), `${+serverTime()}`);

/**
 * Retrieve the last time self-audit was executed. It defaults
 * to 0 if none can be found
 */
export const getAuditResult = async (userID: string, ktLSAPI: KTLocalStorageAPI) => {
    const auditBlob = await ktLSAPI.getItem(generateKeyAuditName(userID));
    if (auditBlob) {
        return parseInt(auditBlob, 10);
    }
};
