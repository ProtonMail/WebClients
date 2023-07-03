import {
    KeyTransparencyError,
    fetchAndVerifyLatestEpoch,
    fetchProof,
    ktSentryReport,
    ktSentryReportError,
    verifyProofOfAbscenceForAllRevision,
} from '@proton/key-transparency/lib';
import { Api, KeyMigrationKTVerifier, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

const createKeyMigrationKTVerifier = (ktActivation: KeyTransparencyActivation, api: Api): KeyMigrationKTVerifier => {
    return async (email: string) => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }
        try {
            const epoch = await fetchAndVerifyLatestEpoch(api);
            const proof = await fetchProof(epoch.EpochID, email, 1, api);
            await verifyProofOfAbscenceForAllRevision(proof, email, epoch.TreeHash);
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
