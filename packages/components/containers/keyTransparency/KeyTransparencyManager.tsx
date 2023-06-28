import { ReactNode, useEffect, useState } from 'react';

import { CryptoProxy, serverTime } from '@proton/crypto';
import {
    AddressAuditStatus,
    EXPECTED_EPOCH_INTERVAL,
    KTBlobContent,
    KTPublicKeyStatus,
    SelfAuditResult,
    commitSKLToLS,
    getAuditResult,
    getKTLocalStorage,
    ktSentryReport,
    selfAudit,
    storeAuditResult,
    verifyPublicKeysAddressAndCatchall,
} from '@proton/key-transparency';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    TelemetryKeyTransparencySelfAuditErrorEvents,
    TelemetryMeasurementGroups,
    TelemetryReport,
} from '@proton/shared/lib/api/telemetry';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { stringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { sendMultipleTelemetryReports } from '@proton/shared/lib/helpers/metrics';
import {
    ArmoredKeyWithFlags,
    FetchedSignedKeyList,
    KeyTransparencyActivation,
    KeyTransparencyState,
    SaveSKLToLS,
    SimpleMap,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { getWarningReason } from '@proton/shared/lib/keyTransparency/telemetry';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { useApi, useGetAddresses, useGetUserKeys, useUser } from '../../hooks';
import { KTContext } from './ktContext';
import { removeKTBlobs } from './ktStatus';
import useGetLatestEpoch from './useGetLatestEpoch';
import useKTActivation from './useKTActivation';
import { KeyTransparencyContext } from './useKeyTransparencyContext';

/**
 * Generate a unique fake ID from an email address
 */
const generateID = async (userID: string, email: string) => {
    const digest = await CryptoProxy.computeHash({
        algorithm: 'SHA256',
        data: stringToUint8Array(`${userID}${email}`),
    });
    return uint8ArrayToBase64String(digest.slice(0, 64)).replace(/\+/g, '-').replace(/\//g, '_');
};

interface Props {
    children: ReactNode;
    appName: APP_NAMES;
}

const KeyTransparencyManager = ({ children, appName }: Props) => {
    const ktActivation = useKTActivation();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const getLatestEpoch = useGetLatestEpoch();
    const [{ ID: userID }] = useUser();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const ktLSAPI = getKTLocalStorage(appName);

    const [ktState, setKTState] = useState<KeyTransparencyState>({ selfAuditResult: undefined });

    const saveSKLToLS: SaveSKLToLS = async (
        email: string,
        data: string,
        revision: number,
        expectedMinEpochID: number,
        addressID?: string,
        isCatchall?: boolean
    ) => {
        // The fake address is generated just for matching purposes inside the stashedKeys
        // structure and to avoid writing the email in plaintext in localStorage
        const storedAddressID = addressID ?? (await generateID(userID, email));

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

    const verifyOutboundPublicKeys: VerifyOutboundPublicKeys = async (
        email: string,
        keysIntendendedForEmail: boolean,
        address: {
            keyList: ArmoredKeyWithFlags[];
            signedKeyList: FetchedSignedKeyList | null;
        },
        catchAll?: {
            keyList: ArmoredKeyWithFlags[];
            signedKeyList: FetchedSignedKeyList | null;
        }
    ): Promise<{
        addressKTStatus?: KTPublicKeyStatus;
        catchAllKTStatus?: KTPublicKeyStatus;
    }> => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return {};
        }
        return verifyPublicKeysAddressAndCatchall(
            silentApi,
            saveSKLToLS,
            getLatestEpoch,
            email,
            keysIntendendedForEmail,
            address,
            catchAll
        ).catch((error) => {
            const errorMessage = error instanceof Error ? error.message : 'unknown error';
            const stack = error instanceof Error ? error.stack : undefined;
            ktSentryReport(errorMessage, { context: 'VerifyOutboundPublicKeys', stack });
            return {};
        });
    };

    const reportSelfAuditErrors = async (selfAuditResult: SelfAuditResult) => {
        const failedAddressAuditsResults = selfAuditResult.addressAuditResults.filter(
            ({ status }) => status !== AddressAuditStatus.Success
        );
        const failedLocalStorageAuditsOwn = selfAuditResult.localStorageAuditResultsOwnAddress.filter(
            ({ success }) => !success
        );
        const failedLocalStorageAuditsOther = selfAuditResult.localStorageAuditResultsOtherAddress.filter(
            ({ success }) => !success
        );

        const failedAddressAudits = failedAddressAuditsResults.map(({ email, status, warningDetails }) => ({
            email,
            status,
            warningDetails,
        }));
        const failedLSAuditsOwn = failedLocalStorageAuditsOwn.map(({ email }) => email);
        const failedLSAuditsOther = failedLocalStorageAuditsOther.map(({ email }) => email);

        if (failedAddressAudits.length || failedLSAuditsOwn.length || failedLSAuditsOther.length) {
            ktSentryReport('Self audit would display an error', {
                failedAddressAudits,
                failedLSAuditsOwn,
                failedLSAuditsOther,
            });

            const reports: TelemetryReport[] = [];

            failedAddressAuditsResults.forEach(({ status, warningDetails }) => {
                const dimensions: SimpleMap<string> = {
                    type: 'address',
                    result: status === AddressAuditStatus.Warning ? 'warning' : 'failure',
                    reason: getWarningReason(warningDetails),
                };

                reports.push({
                    measurementGroup: TelemetryMeasurementGroups.keyTransparency,
                    event: TelemetryKeyTransparencySelfAuditErrorEvents.self_audit_error,
                    dimensions,
                });
            });
            failedLocalStorageAuditsOwn.forEach(() => {
                const dimensions: SimpleMap<string> = {
                    type: 'local_storage_own_keys',
                    result: 'failure',
                    reason: 'local_key_changes_not_applied',
                };

                reports.push({
                    measurementGroup: TelemetryMeasurementGroups.keyTransparency,
                    event: TelemetryKeyTransparencySelfAuditErrorEvents.self_audit_error,
                    dimensions,
                });
            });
            failedLocalStorageAuditsOther.forEach(() => {
                const dimensions: SimpleMap<string> = {
                    type: 'local_storage_other_keys',
                    result: 'failure',
                    reason: 'past_keys_not_authentic',
                };

                reports.push({
                    measurementGroup: TelemetryMeasurementGroups.keyTransparency,
                    event: TelemetryKeyTransparencySelfAuditErrorEvents.self_audit_error,
                    dimensions,
                });
            });

            void sendMultipleTelemetryReports({
                api: silentApi,
                reports,
            });
        }
    };

    const runSelfAudit = async () => {
        // Since we cannot check the feature flag at login time, the
        // createPreAuthKTVerifier helper might have created blobs
        // in local storage. If this is the case and the feature flag
        // turns out to be disabled, we remove them all
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            const addresses = await getAddresses();
            await removeKTBlobs(
                userID,
                addresses.map(({ ID }) => ID),
                ktLSAPI
            );
            return;
        }
        const userKeys = await getUserKeys();
        const userPrivateKeys = userKeys.map(({ privateKey }) => privateKey);
        const { publicKey: userPrimaryPublicKey } = getPrimaryKey(userKeys) || {};
        if (!userPrimaryPublicKey) {
            throw new Error('User has no user keys');
        }
        const lastSelfAudit = await getAuditResult(userID, userPrivateKeys, ktLSAPI);
        const lastSelfAuditTime = lastSelfAudit?.auditTime ?? 0;
        const elapsedTime = +serverTime() - lastSelfAuditTime;
        let timer = EXPECTED_EPOCH_INTERVAL;
        if (elapsedTime > EXPECTED_EPOCH_INTERVAL) {
            try {
                const addresses = await getAddresses();
                const selfAuditResult = await selfAudit(
                    userID,
                    silentApi,
                    addresses,
                    userKeys,
                    ktLSAPI,
                    saveSKLToLS,
                    getLatestEpoch
                );
                await reportSelfAuditErrors(selfAuditResult);
                if (selfAuditResult) {
                    await storeAuditResult(userID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
                    setKTState({ selfAuditResult });
                }
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : 'unknown error';
                const stack = error instanceof Error ? error.stack : undefined;
                ktSentryReport(errorMessage, { context: 'SelfAudit', stack });
                return;
            }
        } else {
            setKTState({ selfAuditResult: lastSelfAudit ?? undefined });
            timer = elapsedTime;
        }

        // Repeat every expectedEpochInterval (4h)
        setTimeout(() => {
            void runSelfAudit();
        }, timer);
    };

    useEffect(() => {
        runSelfAudit().catch((error) => {
            const errorMessage = error instanceof Error ? error.message : 'unknown error';
            const stack = error instanceof Error ? error.stack : undefined;
            ktSentryReport(errorMessage, { context: 'runSelfAudit', stack });
        });
    }, [ktActivation]);

    const ktFunctions: KTContext = {
        ktState,
        ktActivation,
        verifyOutboundPublicKeys,
    };

    return <KeyTransparencyContext.Provider value={ktFunctions}>{children}</KeyTransparencyContext.Provider>;
};

export default KeyTransparencyManager;
