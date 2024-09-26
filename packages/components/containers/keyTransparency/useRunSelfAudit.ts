import { useCallback } from 'react';

import { CryptoProxy, serverTime } from '@proton/crypto';
import type { SelfAuditResult } from '@proton/key-transparency/lib';
import {
    StaleEpochError,
    getKTLocalStorage,
    getSelfAuditInterval,
    ktSentryReportError,
    selfAudit,
} from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { INTERVAL_EVENT_TIMER, MINUTE } from '@proton/shared/lib/constants';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { DecryptedAddressKey, KeyPair, SelfAuditState } from '@proton/shared/lib/interfaces';

import {
    useApi,
    useConfig,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetUser,
    useGetUserKeys,
} from '../../hooks';
import useGetLatestEpoch from './useGetLatestEpoch';
import useReportSelfAuditErrors from './useReportSelfAuditErrors';

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
    const getUser = useGetUser();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const getLatestEpoch = useGetLatestEpoch();
    const normalApi = useApi();
    const { APP_NAME: appName } = useConfig();
    const reportSelfAuditErrors = useReportSelfAuditErrors();
    const getAddressKeys = useGetAddressKeys();
    const { subscribe } = useEventManager();

    const createSelfAuditStateUserKeys = useCallback(async (): Promise<KeyPair[]> => {
        const userKeys = await getUserKeys();
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
        /*
         * Wait for the event loop to return an event with no address change
         * At this point self audit can be sure to have the latest version of addresses.
         */
        const waitForAddressUpdates = async () => {
            let resolve: () => void;
            const eventPromise = new Promise<void>((_resolve) => (resolve = _resolve));
            const unsubscribe = subscribe((data) => {
                if (!data.Addresses) {
                    resolve();
                }
            });
            await Promise.any([eventPromise, wait(5 * INTERVAL_EVENT_TIMER)]);
            unsubscribe();
        };

        await waitForAddressUpdates();
        const addressesWithoutKeys = await getAddresses();
        const addressesKeys = await Promise.all(addressesWithoutKeys.map((address) => getAddressKeys(address.ID)));
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
        try {
            const selfAuditResult = await selfAudit({
                userContext: {
                    getUser,
                    getUserKeys,
                    getAddressKeys,
                    appName,
                },
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

            await reportSelfAuditErrors(selfAuditResult);
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
            await reportSelfAuditErrors(selfAuditResult);
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
