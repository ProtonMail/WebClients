import { serverTime } from '@proton/crypto';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import type {
    Api,
    GetLatestEpoch,
    KTLocalStorageAPI,
    KTUserContext,
    SelfAuditState,
} from '@proton/shared/lib/interfaces';

import { getSelfAuditInterval } from '../../helpers/utils';
import type { SelfAuditResult } from '../../interfaces';
import { auditAddress } from './addressAudit';
import { checkLSBlobs } from './verifyLocalStorage';

/**
 * Audit both the user's own SKLs and any SKL the user has used
 * to send messages to
 */
export const selfAudit = async ({
    ktUserContext,
    getLatestEpoch,
    api,
    ktLSAPI,
    state,
}: {
    ktUserContext: KTUserContext;
    state: SelfAuditState;
    api: Api;
    ktLSAPI: KTLocalStorageAPI;
    getLatestEpoch: GetLatestEpoch;
}): Promise<SelfAuditResult> => {
    const epoch = await getLatestEpoch({ api, forceRefresh: true });

    const userPrivateKeys = state.userKeys.map(({ privateKey }) => privateKey);

    const ownEmails = state.addresses.map(({ address }) => address.Email);

    const userID = (await ktUserContext.getUser()).ID;
    const localStorageAuditResults = await checkLSBlobs(userID, userPrivateKeys, ktLSAPI, epoch, api);

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
                return auditAddress({
                    ktUserContext,
                    address: address.address,
                    userKeys: state.userKeys,
                    addressKeys: address.addressKeys,
                    epoch,
                    api,
                });
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
