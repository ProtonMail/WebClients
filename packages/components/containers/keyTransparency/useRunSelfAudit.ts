import { useCallback } from 'react';

import { addressKeysThunk } from '@proton/account/addressKeys';
import { addressesThunk } from '@proton/account/addresses';
import { getKTUserContext } from '@proton/account/kt/actions';
import { userKeysThunk } from '@proton/account/userKeys';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { CryptoProxy, serverTime } from '@proton/crypto';
import {
    StaleEpochError,
    getKTLocalStorage,
    getLatestEpoch,
    getSelfAuditInterval,
    ktSentryReportError,
    reportSelfAuditErrors,
    selfAudit,
} from '@proton/key-transparency';
import type { SelfAuditResult } from '@proton/key-transparency/interfaces';
import { useDispatch } from '@proton/redux-shared-store';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MINUTE } from '@proton/shared/lib/constants';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import type { DecryptedAddressKey, KeyPair, SelfAuditState } from '@proton/shared/lib/interfaces';

const SELF_AUDIT_MAX_TRIALS = 6;

const ignoreError = (error: any): boolean => {
    return error instanceof StaleEpochError;
};

const reportError = (error: any, tooManyRetries: boolean) => {
    if (tooManyRetries || !ignoreError(error)) {
        ktSentryReportError(error, { context: 'runSelfAudit' });
    }
};

const useRunSelfAudit = () => {
    const normalApi = useApi();
    const { APP_NAME: appName } = useConfig();
    const dispatch = useDispatch();

    const createSelfAuditStateUserKeys = useCallback(async (): Promise<KeyPair[]> => {
        const userKeys = await dispatch(userKeysThunk());
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
    }, []);

    const createSelfAuditStateAddressKeys = useCallback(async () => {
        // Ensure addresses are at the latest state
        const addressesWithoutKeys = await dispatch(addressesThunk({ cache: CacheType.None }));
        const addressesKeys = await Promise.all(
            addressesWithoutKeys.map((address) => dispatch(addressKeysThunk({ addressID: address.ID })))
        );
        const exportedAddressesKeys = await Promise.all(
            addressesKeys.map(async (keys) =>
                Promise.all(
                    keys.map(async (key) => {
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
            const addresses = addressesWithoutKeys.map((address, index) => {
                return {
                    address: address,
                    addressKeys: selfAuditAddressesKeys[index],
                };
            });
            return { addresses };
        } finally {
            exportedAddressesKeys.forEach((keys) => keys.forEach(({ privateKey }) => privateKey.fill(0)));
        }
    }, []);

    const createSelfAuditState = useCallback(
        async (lastSelfAudit: SelfAuditResult | undefined): Promise<SelfAuditState> => {
            const [userKeys, addressKeys] = await Promise.all([
                createSelfAuditStateUserKeys(),
                createSelfAuditStateAddressKeys(),
            ]);
            return {
                userKeys,
                lastSelfAudit,
                ...addressKeys,
            };
        },
        []
    );

    const clearSelfAuditState = useCallback(async (state: SelfAuditState) => {
        const clearUserKeysPromise = Promise.all(
            state.userKeys.map(async ({ privateKey }) => CryptoProxy.clearKey({ key: privateKey }))
        );
        const clearAddressKeysPromise = Promise.all(
            state.addresses.map(async ({ addressKeys }) => {
                await Promise.all(addressKeys.map(async ({ privateKey }) => CryptoProxy.clearKey({ key: privateKey })));
            })
        );
        await Promise.all([clearUserKeysPromise, clearAddressKeysPromise]);
    }, []);

    const runSelfAuditWithState = useCallback(async (state: SelfAuditState) => {
        const ktLSAPIPromise = getKTLocalStorage(appName);
        const ktLSAPI = await ktLSAPIPromise;
        if (state.userKeys.length === 0) {
            throw new Error('User has no user keys');
        }
        const ktUserContext = await dispatch(getKTUserContext());
        const ktActivation = ktUserContext.ktActivation;
        try {
            const selfAuditResult = await selfAudit({
                ktUserContext,
                state,
                api: getSilentApi(normalApi),
                ktLSAPI,
                getLatestEpoch,
            });

            // Update local storage value
            document.dispatchEvent(
                new CustomEvent(KEY_TRANSPARENCY_REMINDER_UPDATE, {
                    detail: {
                        value: false,
                    },
                })
            );

            await reportSelfAuditErrors({ selfAuditResult, api: normalApi, ktActivation });
            return { selfAuditResult };
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
            await reportSelfAuditErrors({ selfAuditResult, api: normalApi, ktActivation });
            return { selfAuditResult };
        }
    }, []);

    const runSelfAudit = useCallback(async (lastSelfAudit: SelfAuditResult | undefined) => {
        const state = await createSelfAuditState(lastSelfAudit);
        try {
            return await runSelfAuditWithState(state);
        } finally {
            await clearSelfAuditState(state);
        }
    }, []);

    return runSelfAudit;
};

export default useRunSelfAudit;
