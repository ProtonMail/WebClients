import { ktSentryReport, verifyLatestProofOfAbsence } from '@proton/key-transparency/lib';
import { Api, GetKTActivation, KeyMigrationKTVerifier, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

const createKeyMigrationKTVerifier = (getKTActivation: GetKTActivation, api: Api): KeyMigrationKTVerifier => {
    return async (email: string) => {
        if ((await getKTActivation()) === KeyTransparencyActivation.DISABLED) {
            return;
        }
        try {
            await verifyLatestProofOfAbsence(api, email);
        } catch (error: any) {
            ktSentryReport('Key migration checks failed', {
                context: 'KeyMigrationKTVerifier',
                email,
                error: error.message,
            });
            return;
        }
    };
};

export default createKeyMigrationKTVerifier;
