import { serverTime } from '@proton/crypto';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { Api, KTLocalStorageAPI, SaveSKLToLS, SelfAuditState, UploadMissingSKL } from '@proton/shared/lib/interfaces';

import { getSelfAuditInterval } from '../../helpers';
import { SelfAuditResult } from '../../interfaces';
import { auditAddress } from './addressAudit';
import { checkLSBlobs } from './verifyLocalStorage';

/**
 * Audit both the user's own SKLs and any SKL the user has used
 * to send messages to
 */
export const selfAudit = async (
    userID: string,
    state: SelfAuditState,
    api: Api,
    ktLSAPI: KTLocalStorageAPI,
    saveSKLToLS: SaveSKLToLS,
    uploadMissingSKL: UploadMissingSKL
): Promise<SelfAuditResult> => {
    const userPrivateKeys = state.userKeys.map(({ privateKey }) => privateKey);

    const ownEmails = state.addresses.map(({ address }) => address.Email);

    const localStorageAuditResults = await checkLSBlobs(userID, userPrivateKeys, ktLSAPI, state.epoch, api);

    const localStorageAuditResultsOwnAddress = localStorageAuditResults.filter(({ email }) =>
        ownEmails.includes(email)
    );
    const localStorageAuditResultsOtherAddress = localStorageAuditResults.filter(
        ({ email }) => !ownEmails.includes(email)
    );

    const addressAuditResults = await Promise.all(
        state.addresses
            .filter(({ address }) => !getIsAddressDisabled(address))
            .map((address) => {
                return auditAddress(
                    address.address,
                    state.userKeys,
                    address.addressKeys,
                    state.epoch,
                    saveSKLToLS,
                    api,
                    uploadMissingSKL
                );
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
