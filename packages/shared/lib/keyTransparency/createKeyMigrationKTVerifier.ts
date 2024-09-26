import {
    KeyTransparencyError,
    fetchLatestEpoch,
    ktSentryReport,
    ktSentryReportError,
    verifyAddressIsAbsent,
    verifyAddressIsObsolete,
} from '@proton/key-transparency/lib';

import type { KeyMigrationKTVerifier } from '../interfaces';
import { KeyTransparencyActivation } from '../interfaces';

const createKeyMigrationKTVerifier = (ktActivation: KeyTransparencyActivation): KeyMigrationKTVerifier => {
    return async ({ email, signedKeyList, api }) => {
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
