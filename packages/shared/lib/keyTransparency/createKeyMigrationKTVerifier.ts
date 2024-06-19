import {
    KeyTransparencyError,
    fetchLatestEpoch,
    ktSentryReport,
    ktSentryReportError,
    verifyAddressIsAbsent,
    verifyAddressIsObsolete,
} from '@proton/key-transparency/lib';

import { Api, FetchedSignedKeyList, KeyMigrationKTVerifier, KeyTransparencyActivation } from '../interfaces';

const createKeyMigrationKTVerifier = (ktActivation: KeyTransparencyActivation, api: Api): KeyMigrationKTVerifier => {
    return async (email: string, signedKeyList: Partial<FetchedSignedKeyList> | null | undefined) => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }
        try {
            const epoch = await fetchLatestEpoch(api);
            if (signedKeyList?.ObsolescenceToken) {
                await verifyAddressIsObsolete(epoch, email, signedKeyList, api);
            } else {
                await verifyAddressIsAbsent(epoch, email, api);
            }
        } catch (error: any) {
            if (error instanceof KeyTransparencyError) {
                ktSentryReport('KT error during key migration', { error: error.message });
            } else {
                ktSentryReportError(error, { context: 'KeyMigrationKTVerifier' });
            }
        }
    };
};

export default createKeyMigrationKTVerifier;
