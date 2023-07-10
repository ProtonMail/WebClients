import { CryptoProxy, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { KTLocalStorageAPI } from '@proton/shared/lib/interfaces';

import { ktSentryReportError, throwKTError } from '../helpers/utils';
import { KTBlobContent, KTBlobValuesWithInfo, SelfAuditResult } from '../interfaces';

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

        if (
            ktTag !== 'KT' ||
            storedUserID !== userID ||
            storedAddress === 'audit' ||
            (!!addressID && storedAddress !== addressID)
        ) {
            continue;
        }

        const armoredMessage = await ktLSAPI.getItem(key);
        if (!armoredMessage) {
            return throwKTError('No value found for an existing key', {
                context: 'getAllKTBlobValuesWithInfo',
            });
        }

        try {
            const ktBlobsContent: KTBlobContent[] = JSON.parse(
                (
                    await CryptoProxy.decryptMessage({
                        armoredMessage,
                        decryptionKeys: userPrivateKeys,
                    })
                ).data
            );
            // Legacy blob did not set the revision, we ignore them
            const newKTBlobs = ktBlobsContent.filter(({ revision }) => revision !== undefined);
            ktBlobValuesWithInfoMap.set(storedAddress, {
                userID,
                addressID: storedAddress,
                ktBlobsContent: newKTBlobs,
            });
        } catch (error: any) {
            ktSentryReportError(error, { context: 'getAllKTBlobValuesWithInfo' });
        }
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
 * Commit SKLs to local storage for later checking.
 */
export const commitSKLToLS = async (
    ktBlobContent: KTBlobContent,
    userPrivateKeys: PrivateKeyReference[],
    ktLSAPI: KTLocalStorageAPI,
    userID: string,
    addressID: string
) => {
    try {
        const ktBlobsMap = await getAllKTBlobValuesWithInfo(userID, userPrivateKeys, ktLSAPI, addressID);
        const ktBlobsContent = ktBlobsMap.get(addressID)?.ktBlobsContent || [];
        const isAlreadyInLS =
            ktBlobsContent.filter(
                (ktBlob) => ktBlob.data === ktBlobContent.data && ktBlob.revision === ktBlobContent.revision
            ).length != 0;

        if (!isAlreadyInLS) {
            ktBlobsContent.push(ktBlobContent);
            return await encryptKTtoLS(
                {
                    userID,
                    addressID,
                    ktBlobsContent,
                },
                userPrivateKeys[0],
                ktLSAPI
            );
        }
    } catch (error: any) {
        ktSentryReportError(error, { context: 'commitSKLToLS' });
    }
};

/**
 * Generate a key name according to the KT format for self-audit
 */
const generateKeyAuditName = (userID: string) => `KT:${userID}:audit`;

/**
 * Store the last result of self-audit
 */
export const storeAuditResult = async (
    userID: string,
    selfAuditResult: SelfAuditResult,
    userPrimaryKey: PublicKeyReference,
    ktLSAPI: KTLocalStorageAPI
) => {
    const ciphertext = (
        await CryptoProxy.encryptMessage({
            textData: JSON.stringify(selfAuditResult),
            encryptionKeys: userPrimaryKey,
        })
    ).message;
    ktLSAPI.setItem(generateKeyAuditName(userID), ciphertext);
};

/**
 * Retrieve the last time self-audit was executed. It defaults
 * to null if none can be found
 */
export const getAuditResult = async (
    userID: string,
    userPrivateKeys: PrivateKeyReference[],
    ktLSAPI: KTLocalStorageAPI
): Promise<SelfAuditResult | undefined> => {
    try {
        const armoredMessage = await ktLSAPI.getItem(generateKeyAuditName(userID));
        if (armoredMessage) {
            if (!armoredMessage.startsWith('-----BEGIN PGP MESSAGE-----')) {
                // Old audits blob were only containing the audit time, not encrypted.
                return;
            }
            const decrypted = await CryptoProxy.decryptMessage({
                armoredMessage,
                decryptionKeys: userPrivateKeys,
            });
            const parsed = JSON.parse(decrypted.data);
            if (!parsed.nextAuditTime) {
                return;
            }
            return parsed;
        }
    } catch (error: any) {
        ktSentryReportError(error, { context: 'getAuditResult' });
    }
};
