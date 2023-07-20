import { serverTime } from '@proton/crypto';
import {
    SelfAuditResult,
    getAuditResult,
    getKTLocalStorage,
    getSelfAuditInterval,
    ktSentryReportError,
    selfAudit,
    storeAuditResult,
} from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MINUTE } from '@proton/shared/lib/constants';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { useApi, useConfig, useGetAddressKeys, useGetAddresses, useGetUserKeys, useUser } from '../../hooks';
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
    const ktLSAPI = getKTLocalStorage(appName);
    const uploadMissingSKL = useUploadMissingSKL();
    const saveSKLToLS = useSaveSKLToLS();
    const reportSelfAuditErrors = useReportSelfAuditErrors();
    const getAddressKeys = useGetAddressKeys();
    const selfAuditBaseInterval = getSelfAuditInterval();

    const runSelfAudit = async () => {
        const userKeys = await getUserKeys();
        const userPrivateKeys = userKeys.map(({ privateKey }) => privateKey);
        const { publicKey: userPrimaryPublicKey } = getPrimaryKey(userKeys) || {};
        if (!userPrimaryPublicKey) {
            throw new Error('User has no user keys');
        }
        const lastSelfAudit = await getAuditResult(userID, userPrivateKeys, ktLSAPI);
        const now = +serverTime();
        if (lastSelfAudit && lastSelfAudit.nextAuditTime > now) {
            return { selfAuditResult: lastSelfAudit, nextSelfAuditInterval: lastSelfAudit.nextAuditTime - now };
        }
        const addresses = await getAddresses();
        try {
            const selfAuditResult = await selfAudit(
                userID,
                api,
                addresses,
                userKeys,
                ktLSAPI,
                saveSKLToLS,
                getLatestEpoch,
                uploadMissingSKL,
                getAddressKeys
            );
            await reportSelfAuditErrors(selfAuditResult);
            await storeAuditResult(userID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
            return { selfAuditResult, nextSelfAuditInterval: selfAuditBaseInterval };
        } catch (error: any) {
            ktSentryReportError(error, { context: 'runSelfAudit' });
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
            await storeAuditResult(userID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
            return { selfAuditResult, nextSelfAuditInterval };
        }
    };

    return runSelfAudit;
};

export default useRunSelfAudit;
