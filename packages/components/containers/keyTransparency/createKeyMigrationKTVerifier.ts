import {
    KeyTransparencyError,
    fetchLatestEpoch,
    fetchProof,
    ktSentryReport,
    ktSentryReportError,
    verifyProofOfAbsenceForAllRevision,
    verifyProofOfObsolescenceLatest,
} from "@proton/key-transparency/lib";
import {
    Api,
    KeyMigrationKTVerifier,
    KeyTransparencyActivation,
    FetchedSignedKeyList,
} from "@proton/shared/lib/interfaces";

const createKeyMigrationKTVerifier = (ktActivation: KeyTransparencyActivation, api: Api): KeyMigrationKTVerifier => {
    return async (email: string, signedKeyList: Partial<FetchedSignedKeyList> | null | undefined) => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }
        try {
            const epoch = await fetchLatestEpoch(api);
            if (signedKeyList?.ObsolescenceToken) {
                const revisionToCheck = signedKeyList?.Revision ?? 1;
                const obsolescenceProof = await fetchProof(epoch.EpochID, email, revisionToCheck, api);
                const absenceProof = await fetchProof(epoch.EpochID, email, revisionToCheck + 1, api);
                await verifyProofOfObsolescenceLatest(
                    obsolescenceProof,
                    absenceProof,
                    email,
                    epoch.TreeHash,
                    signedKeyList
                );
            } else {
                const absenceProof = await fetchProof(epoch.EpochID, email, 1, api);
                await verifyProofOfAbsenceForAllRevision(absenceProof, email, epoch.TreeHash);
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
