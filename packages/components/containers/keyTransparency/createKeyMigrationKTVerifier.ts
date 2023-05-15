import { ktSentryReport, verifyLatestProofOfAbsence } from '@proton/key-transparency/lib';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Api, KeyMigrationKTVerifier } from '@proton/shared/lib/interfaces';

import { KT_FF, isKTActive } from './ktStatus';

const createKeyMigrationKTVerifier = (
    getFF: () => Promise<KT_FF>,
    api: Api,
    appName: APP_NAMES
): KeyMigrationKTVerifier => {
    return async (email: string) => {
        const featureFlag = await getFF();
        if (!(await isKTActive(appName, featureFlag))) {
            return;
        }
        try {
            await verifyLatestProofOfAbsence(api, email);
        } catch (error: any) {
            ktSentryReport('Key migration checks failed', {
                context: 'KeyMigrationKTVerifier',
                error: error.message,
            });
            return;
        }
    };
};

export default createKeyMigrationKTVerifier;
