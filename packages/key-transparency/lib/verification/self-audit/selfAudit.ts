import { serverTime } from '@proton/crypto';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    KTLocalStorageAPI,
    SaveSKLToLS,
    UploadMissingSKL,
} from '@proton/shared/lib/interfaces';

import { getSelfAuditInterval } from '../../helpers';
import { Epoch, SelfAuditResult } from '../../interfaces';
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
    epoch: Epoch,
    uploadMissingSKL: UploadMissingSKL,
    getAddressKeys: (id: string) => Promise<DecryptedAddressKey[]>
): Promise<SelfAuditResult> => {
    const userPrivateKeys = userKeys.map(({ privateKey }) => privateKey);

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
                return auditAddress(address, userKeys, epoch, saveSKLToLS, api, uploadMissingSKL, getAddressKeys);
            })
    );
    const currentTime = +serverTime();
    return {
        auditTime: currentTime,
        nextAuditTime: currentTime + getSelfAuditInterval(),
        addressAuditResults,
        localStorageAuditResultsOwnAddress,
        localStorageAuditResultsOtherAddress,
    };
};
