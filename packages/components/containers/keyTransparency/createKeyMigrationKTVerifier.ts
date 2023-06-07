import {
    KeyTransparencyError,
    fetchAndVerifyLatestEpoch,
    fetchProof,
    ktSentryReport,
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
                const errorMessage = error instanceof Error ? error.message : 'unknown error';
                const stack = error instanceof Error ? error.stack : undefined;
                ktSentryReport(errorMessage, { context: 'KeyMigrationKTVerifier', stack });
            }
        }
    };
};

export default createKeyMigrationKTVerifier;
