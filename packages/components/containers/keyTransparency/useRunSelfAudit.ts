import { useCallback } from 'react';

import { CryptoProxy, serverTime } from '@proton/crypto';
import {
    SelfAuditResult,
    StaleEpochError,
    getAuditResult,
    getKTLocalStorage,
    getSelfAuditInterval,
    ktSentryReportError,
    selfAudit,
    storeAuditResult,
} from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { INTERVAL_EVENT_TIMER, MINUTE } from '@proton/shared/lib/constants';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import { wait } from '@proton/shared/lib/helpers/promise';
import { DecryptedAddressKey, KeyPair, SelfAuditState } from '@proton/shared/lib/interfaces';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { AddressesModel } from '@proton/shared/lib/models';

import {
    useApi,
    useConfig,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetUserKeys,
    useUser,
} from '../../hooks';
import useGetLatestEpoch from './useGetLatestEpoch';
import useReportSelfAuditErrors from './useReportSelfAuditErrors';
import useSaveSKLToLS from './useSaveSKLToLS';
import useUploadMissingSKL from './useUploadMissingSKL';

const SELF_AUDIT_MAX_TRIALS = 6;

const useRunSelfAudit = () => {
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const getLatestEpoch = useGetLatestEpoch();
    const [{ ID: userID }] = useUser();
    const api = getSilentApi(useApi());
    const { APP_NAME: appName } = useConfig();
    const ktLSAPIPromise = getKTLocalStorage(appName);
    const uploadMissingSKL = useUploadMissingSKL();
    const saveSKLToLS = useSaveSKLToLS();
    const reportSelfAuditErrors = useReportSelfAuditErrors();
    const getAddressKeys = useGetAddressKeys();
    const selfAuditBaseInterval = getSelfAuditInterval();
    const { subscribe } = useEventManager();

    /*
     * Wait for the event loop to return an event with no address change
     * At this point self audit can be sure to have the latest version of addresses.
     */
    const waitForAddressUpdates = async () => {
        let resolve: () => void;
        const eventPromise = new Promise<void>((_resolve) => (resolve = _resolve));
        const unsubscribe = subscribe((data) => {
            if (!data[AddressesModel.key]) {
                resolve();
            }
        });
        await Promise.any([eventPromise, wait(5 * INTERVAL_EVENT_TIMER)]);
        unsubscribe();
    };

    const ignoreError = (error: any): boolean => {
        return error instanceof StaleEpochError;
    };

    const reportError = (error: any, tooManyRetries: boolean) => {
        if (tooManyRetries || !ignoreError(error)) {
            ktSentryReportError(error, { context: 'runSelfAudit' });
        }
    };

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
    }, [getUserKeys]);

    const createSelfAuditStateAddressKeys = useCallback(async () => {
        const epoch = await getLatestEpoch(true);
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
            return { epoch, addresses };
        } finally {
            exportedAddressesKeys.forEach((keys) => keys.forEach(({ privateKey }) => privateKey.fill(0)));
        }
    }, [getLatestEpoch, getAddresses, getAddressKeys]);

    const createSelfAuditState = async (): Promise<SelfAuditState> => {
        const [userKeys, addressKeys] = await Promise.all([
            createSelfAuditStateUserKeys(),
            createSelfAuditStateAddressKeys(),
        ]);
        return {
            userKeys,
            ...addressKeys,
        };
    };

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

    const runSelfAuditWithState = async (state: SelfAuditState) => {
        const userPrivateKeys = state.userKeys.map(({ privateKey }) => privateKey);
        const { publicKey: userPrimaryPublicKey } = getPrimaryKey(state.userKeys) || {};
        const ktLSAPI = await ktLSAPIPromise;
        if (!userPrimaryPublicKey) {
            throw new Error('User has no user keys');
        }
        const lastSelfAudit = await getAuditResult(userID, userPrivateKeys, ktLSAPI);
        const now = +serverTime();
        if (lastSelfAudit && lastSelfAudit.nextAuditTime > now) {
            return { selfAuditResult: lastSelfAudit, nextSelfAuditInterval: lastSelfAudit.nextAuditTime - now };
        }

        try {
            const selfAuditResult = await selfAudit(userID, state, api, ktLSAPI, saveSKLToLS, uploadMissingSKL);

            // Update local storage value
            document.dispatchEvent(
                new CustomEvent(KEY_TRANSPARENCY_REMINDER_UPDATE, {
                    detail: {
                        value: false,
                    },
                })
            );

            await reportSelfAuditErrors(selfAuditResult);
            await storeAuditResult(userID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
            return { selfAuditResult, nextSelfAuditInterval: selfAuditBaseInterval };
        } catch (error: any) {
            const failedTrials = (lastSelfAudit?.error?.failedTrials ?? 0) + 1;
            const tooManyRetries = failedTrials >= SELF_AUDIT_MAX_TRIALS;
            const currentTime = +serverTime();
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
            await storeAuditResult(userID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
            return { selfAuditResult, nextSelfAuditInterval };
        }
    };

    const runSelfAudit = async () => {
        const state = await createSelfAuditState();
        try {
            return await runSelfAuditWithState(state);
        } finally {
            await clearSelfAuditState(state);
        }
    };

    return runSelfAudit;
};

export default useRunSelfAudit;
