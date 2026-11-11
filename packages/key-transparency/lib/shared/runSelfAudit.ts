import { CryptoProxy, serverTime } from '@protontech/crypto';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedAddressKey, DecryptedKey, KeyPair } from '@proton/shared/lib/interfaces/Key';
import type { KTUserContext } from '@proton/shared/lib/interfaces/KeyTransparency';

import { getLatestEpoch } from '../helpers/getLatestEpoch';
import { KT_ERROR_TYPE, StaleEpochError, getSelfAuditInterval, ktSentryReportError } from '../helpers/utils';
import type { SelfAuditResult, SelfAuditState } from '../interfaces';
import { getKTLocalStorage } from '../storage/ktStorageAPI';
import { selfAudit } from '../verification/self-audit/selfAudit';
import { reportSelfAuditErrors } from './reportSelfAuditErrors';

const SELF_AUDIT_MAX_TRIALS = 6;

/** Delay before auditing when there's no previous audit, or when the next one is already due */
const PENDING_SELF_AUDIT_DELAY = 10 * SECOND;

const ignoreError = (error: any): boolean => {
    return error instanceof StaleEpochError;
};

const reportError = (error: any, tooManyRetries: boolean) => {
    if (tooManyRetries || !ignoreError(error)) {
        ktSentryReportError(error, KT_ERROR_TYPE.LOCAL, { context: 'runSelfAudit' });
    }
};

/**
 * How long until the next self-audit is due, given the result of the last one.
 */
export const getSelfAuditDelay = (lastSelfAudit: SelfAuditResult | undefined) => {
    const now = +serverTime();
    if (lastSelfAudit && lastSelfAudit.nextAuditTime > now) {
        return lastSelfAudit.nextAuditTime - now;
    }
    return PENDING_SELF_AUDIT_DELAY;
};

const copyUserKeys = async (userKeys: DecryptedKey[]): Promise<KeyPair[]> => {
    const exportedUserKeys = await Promise.all(
        userKeys.map((key) =>
            CryptoProxy.exportPrivateKey({
                privateKey: key.privateKey,
                passphrase: null,
                format: 'binary',
            })
        )
    );
    try {
        const selfAuditKeyReferences = await Promise.all(
            exportedUserKeys.map(async (key) => {
                const privateKey = await CryptoProxy.importPrivateKey({
                    binaryKey: key,
                    passphrase: null,
                });
                return {
                    privateKey: privateKey,
                    publicKey: privateKey,
                };
            })
        );
        return selfAuditKeyReferences;
    } finally {
        exportedUserKeys.forEach((privateKey) => privateKey.fill(0));
    }
};

const copyAddressesKeys = async (addresses: SelfAuditState['addresses']): Promise<SelfAuditState['addresses']> => {
    const exportedAddressesKeys = await Promise.all(
        addresses.map(async ({ addressKeys }) =>
            Promise.all(
                addressKeys.map(async (key) => {
                    const privateKey = await CryptoProxy.exportPrivateKey({
                        privateKey: key.privateKey,
                        passphrase: null,
                        format: 'binary',
                    });
                    return {
                        ID: key.ID,
                        Flags: key.Flags,
                        Primary: key.Primary,
                        privateKey,
                    };
                })
            )
        )
    );
    try {
        const selfAuditAddressesKeys = await Promise.all<Promise<DecryptedAddressKey[]>>(
            exportedAddressesKeys.map(async (keys) =>
                Promise.all(
                    keys.map(async (key) => {
                        const privateKey = await CryptoProxy.importPrivateKey({
                            binaryKey: key.privateKey,
                            passphrase: null,
                        });
                        return {
                            ID: key.ID,
                            Flags: key.Flags,
                            Primary: key.Primary,
                            privateKey: privateKey,
                            publicKey: privateKey,
                        };
                    })
                )
            )
        );
        return addresses.map(({ address }, index) => {
            return {
                address: address,
                addressKeys: selfAuditAddressesKeys[index],
            };
        });
    } finally {
        exportedAddressesKeys.forEach((keys) => keys.forEach(({ privateKey }) => privateKey.fill(0)));
    }
};

/**
 * The self-audit gets its own copies of the keys, so that it can clear them once done.
 */
const createSelfAuditState = async ({
    ktUserContext,
    addresses,
    lastSelfAudit,
}: {
    ktUserContext: KTUserContext;
    addresses: SelfAuditState['addresses'];
    lastSelfAudit: SelfAuditResult | undefined;
}): Promise<SelfAuditState> => {
    const [userKeys, addressesWithKeyCopies] = await Promise.all([
        ktUserContext.getUserKeys().then(copyUserKeys),
        copyAddressesKeys(addresses),
    ]);
    return {
        userKeys,
        lastSelfAudit,
        addresses: addressesWithKeyCopies,
    };
};

const clearSelfAuditState = async (state: SelfAuditState) => {
    const clearUserKeysPromise = Promise.all(
        state.userKeys.map(async ({ privateKey }) => CryptoProxy.clearKey({ key: privateKey }))
    );
    const clearAddressKeysPromise = Promise.all(
        state.addresses.map(async ({ addressKeys }) => {
            await Promise.all(addressKeys.map(async ({ privateKey }) => CryptoProxy.clearKey({ key: privateKey })));
        })
    );
    await Promise.all([clearUserKeysPromise, clearAddressKeysPromise]);
};

const runSelfAuditWithState = async ({
    ktUserContext,
    api,
    state,
}: {
    ktUserContext: KTUserContext;
    api: Api;
    state: SelfAuditState;
}): Promise<SelfAuditResult> => {
    const ktLSAPI = await getKTLocalStorage(ktUserContext.appName);
    if (state.userKeys.length === 0) {
        throw new Error('User has no user keys');
    }
    const { ktActivation } = ktUserContext;
    try {
        const selfAuditResult = await selfAudit({
            ktUserContext,
            state,
            api: getSilentApi(api),
            ktLSAPI,
            getLatestEpoch,
        });
        reportSelfAuditErrors({ selfAuditResult, api, ktActivation });
        return selfAuditResult;
    } catch (error: any) {
        const failedTrials = (state.lastSelfAudit?.error?.failedTrials ?? 0) + 1;
        const tooManyRetries = failedTrials >= SELF_AUDIT_MAX_TRIALS;
        const currentTime = +serverTime();
        const selfAuditBaseInterval = getSelfAuditInterval();
        const nextSelfAuditInterval = tooManyRetries
            ? selfAuditBaseInterval
            : Math.min(Math.pow(2, failedTrials) * MINUTE, selfAuditBaseInterval);
        const selfAuditResult: SelfAuditResult = {
            auditTime: currentTime,
            nextAuditTime: currentTime + nextSelfAuditInterval,
            addressAuditResults: [],
            localStorageAuditResultsOtherAddress: [],
            localStorageAuditResultsOwnAddress: [],
            error: { failedTrials: tooManyRetries ? 0 : failedTrials, tooManyRetries },
        };
        reportError(error, tooManyRetries);
        reportSelfAuditErrors({ selfAuditResult, api, ktActivation });
        return selfAuditResult;
    }
};

/**
 * Audits the user's own addresses, and the keys of other addresses saved to local storage.
 * A failing audit still resolves, with a result that schedules a retry with an exponential backoff.
 * It only rejects when the audit can't be set up, e.g. when the user has no keys.
 */
export const runSelfAudit = async ({
    ktUserContext,
    api,
    addresses,
    lastSelfAudit,
}: {
    ktUserContext: KTUserContext;
    api: Api;
    /** The addresses to audit, with their decrypted keys. The audit works on copies of the keys. */
    addresses: SelfAuditState['addresses'];
    lastSelfAudit: SelfAuditResult | undefined;
}): Promise<SelfAuditResult> => {
    const state = await createSelfAuditState({ ktUserContext, addresses, lastSelfAudit });
    try {
        return await runSelfAuditWithState({ ktUserContext, api, state });
    } finally {
        await clearSelfAuditState(state);
    }
};
