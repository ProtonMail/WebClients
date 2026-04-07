import type { KeyMigrationKTVerifier } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { fetchLatestEpoch } from '../helpers/apiHelpers';
import { KeyTransparencyError, KT_ERROR_TYPE, ktSentryReport, ktSentryReportError } from '../helpers/utils';
import { verifyAddressIsAbsent, verifyAddressIsObsolete } from '../verification/verifyAddress';

export const createKeyMigrationKTVerifier = (ktActivation: KeyTransparencyActivation): KeyMigrationKTVerifier => {
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
                ktSentryReport('KT error during key migration', KT_ERROR_TYPE.LOCAL, { error: error.message });
            } else {
                ktSentryReportError(error, KT_ERROR_TYPE.LOCAL, { context: 'KeyMigrationKTVerifier' });
            }
        }
    };
};
