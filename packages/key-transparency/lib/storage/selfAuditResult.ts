import type { KTUserContext } from '@proton/shared/lib/interfaces/KeyTransparency';
import { getPrimaryKey } from '@proton/shared/lib/keys/getPrimaryKey';

import type { SelfAuditResult } from '../interfaces';
import { getKTLocalStorage } from './ktStorageAPI';
import { getAuditResult, storeAuditResult } from './storageHelpers';

/**
 * Loads the result of the last self-audit, stored in local storage encrypted with the user keys.
 */
export const loadSelfAuditResult = async ({
    ktUserContext: { appName, getUser, getUserKeys },
}: {
    ktUserContext: KTUserContext;
}): Promise<SelfAuditResult | undefined> => {
    const [user, userKeys, ktLSAPI] = await Promise.all([getUser(), getUserKeys(), getKTLocalStorage(appName)]);
    const userPrivateKeys = userKeys.map(({ privateKey }) => privateKey);
    return getAuditResult(user.ID, userPrivateKeys, ktLSAPI);
};

/**
 * Stores the result of a self-audit in local storage, encrypted with the primary user key.
 */
export const storeSelfAuditResult = async ({
    ktUserContext: { appName, getUser, getUserKeys },
    selfAuditResult,
}: {
    ktUserContext: KTUserContext;
    selfAuditResult: SelfAuditResult;
}) => {
    const [user, userKeys, ktLSAPI] = await Promise.all([getUser(), getUserKeys(), getKTLocalStorage(appName)]);
    const { publicKey: userPrimaryPublicKey } = getPrimaryKey(userKeys) || {};
    if (userPrimaryPublicKey) {
        await storeAuditResult(user.ID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
    }
};
