import { serverTime } from '@proton/crypto';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import {
    Address,
    Api,
    DecryptedKey,
    GetLatestEpoch,
    KTLocalStorageAPI,
    SaveSKLToLS,
} from '@proton/shared/lib/interfaces';

import { SelfAuditResult } from '../../interfaces';
import { auditAddress } from './addressAudit';
import { checkLSBlobs } from './verifyLocalStorage';

/**
 * Audit both the user's own SKLs and any SKL the user has used
 * to send messages to
 */
export const selfAudit = async (
    userID: string,
    api: Api,
    addresses: Address[],
    userKeys: DecryptedKey[],
    ktLSAPI: KTLocalStorageAPI,
    saveSKLToLS: SaveSKLToLS,
    getLatestEpoch: GetLatestEpoch
): Promise<SelfAuditResult> => {
    const userPrivateKeys = userKeys.map(({ privateKey }) => privateKey);

    const epoch = await getLatestEpoch(true);
    const ownEmails = addresses.map(({ Email }) => Email);

    const localStorageAuditResults = await checkLSBlobs(userID, userPrivateKeys, ktLSAPI, epoch, api);

    const localStorageAuditResultsOwnAddress = localStorageAuditResults.filter(({ email }) =>
        ownEmails.includes(email)
    );
    const localStorageAuditResultsOtherAddress = localStorageAuditResults.filter(
        ({ email }) => !ownEmails.includes(email)
    );

    const addressAuditResults = await Promise.all(
        addresses
            .filter((address) => !getIsAddressDisabled(address))
            .map((address) => {
                return auditAddress(address, userKeys, epoch, saveSKLToLS, api);
            })
    );

    return {
        auditTime: +serverTime(),
        addressAuditResults,
        localStorageAuditResultsOwnAddress,
        localStorageAuditResultsOtherAddress,
    };
};
