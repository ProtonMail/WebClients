import { serverTime } from 'pmcrypto';

import {
    getAuditResult,
    getKTLocalStorage,
    getSelfAuditInterval,
    ktSentryReportError,
    selfAudit,
    storeAuditResult,
} from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { KeyTransparencyActivation, KeyTransparencyState } from '@proton/shared/lib/interfaces';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { useApi, useConfig, useGetAddresses, useGetUserKeys, useUser } from '../../hooks';
import useGetLatestEpoch from './useGetLatestEpoch';
import useKTActivation from './useKTActivation';
import useReportSelfAuditErrors from './useReportSelfAuditErrors';
import useSaveSKLToLS from './useSaveSKLToLS';
import useUploadMissingSKL from './useUploadMissingSKL';

const useRunSelfAudit = (setKTState: (state: KeyTransparencyState) => void) => {
    const ktActivation = useKTActivation();
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
    const selfAuditInterval = getSelfAuditInterval();

    const runSelfAudit = async () => {
        try {
            if (ktActivation === KeyTransparencyActivation.DISABLED) {
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
            let timer = selfAuditInterval;
            if (elapsedTime > selfAuditInterval) {
                try {
                    const addresses = await getAddresses();
                    const selfAuditResult = await selfAudit(
                        userID,
                        api,
                        addresses,
                        userKeys,
                        ktLSAPI,
                        saveSKLToLS,
                        getLatestEpoch,
                        uploadMissingSKL
                    );
                    await reportSelfAuditErrors(selfAuditResult);
                    if (selfAuditResult) {
                        await storeAuditResult(userID, selfAuditResult, userPrimaryPublicKey, ktLSAPI);
                        setKTState({ selfAuditResult });
                    }
                } catch (error: any) {
                    ktSentryReportError(error, { context: 'SelfAudit' });
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
        } catch (error: any) {
            ktSentryReportError(error, { context: 'runSelfAudit' });
        }
    };

    return runSelfAudit;
};

export default useRunSelfAudit;
