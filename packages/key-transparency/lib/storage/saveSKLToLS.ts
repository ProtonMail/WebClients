import { CryptoProxy, serverTime } from '@proton/crypto';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { SaveSKLToLS } from '@proton/shared/lib/interfaces';

import type { KTBlobContent } from '../interfaces';
import { getKTLocalStorage } from './ktStorageAPI';
import { commitSKLToLS } from './storageHelpers';

/**
 * Generate a unique fake ID from an email address
 */
const generateID = async (userID: string, email: string) => {
    const digest = await CryptoProxy.computeHash({
        algorithm: 'SHA256',
        data: stringToUint8Array(`${userID}${email}`),
    });
    return digest.slice(0, 64).toBase64({ alphabet: 'base64url', omitPadding: true });
};

export const saveSKLToLS: SaveSKLToLS = async ({
    ktUserContext: { appName, getUser, getUserKeys },
    email,
    data,
    revision,
    expectedMinEpochID,
    addressID,
    isCatchall,
}) => {
    const ktLSAPIPromise = getKTLocalStorage(appName);
    const userID = (await getUser()).ID;
    // The fake address is generated just for matching purposes inside the stashedKeys
    // structure and to avoid writing the email in plaintext in localStorage
    const storedAddressID = addressID ?? (await generateID(userID, email));
    const ktLSAPI = await ktLSAPIPromise;
    const ktBlobContent: KTBlobContent = {
        creationTimestamp: +serverTime(),
        email,
        data,
        revision,
        expectedMinEpochID,
        isCatchall,
    };

    const userKeys = await getUserKeys();
    await commitSKLToLS(
        ktBlobContent,
        userKeys.map(({ privateKey }) => privateKey),
        ktLSAPI,
        userID,
        storedAddressID
    );
};
