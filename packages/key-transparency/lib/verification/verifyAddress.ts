import { Api, FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { fetchProof, throwKTError } from '../helpers';
import { Epoch } from '../interfaces';
import {
    verifyProofOfAbsenceForAllRevision,
    verifyProofOfAbsenceForRevision,
    verifyProofOfObsolescence,
} from './verifyProofs';

/**
 * Check if the address is obsolete in key transparency by fetching the proofs
 * at the SKL revision and the next revision. If the first is a valid obsolescence proof and
 * the second is a valid absence proof (i.e., the obsolete SKL is at the latest revision),
 * the address is verifiably obsolete in KT.
 */
export const verifyAddressIsObsolete = async (
    epoch: Epoch,
    email: string,
    signedKeyList: Partial<FetchedSignedKeyList>,
    api: Api
) => {
    const { Revision } = signedKeyList;
    if (!Revision) {
        return throwKTError('Obsolescence proof with incomplete information', {
            email,
            signedKeyList,
        });
    }
    const checkObsolescence = async () => {
        const obsolescenceProof = await fetchProof(epoch.EpochID, email, Revision, api);
        await verifyProofOfObsolescence(obsolescenceProof, email, epoch.TreeHash, signedKeyList);
    };
    const checkAbsence = async () => {
        const absenceProof = await fetchProof(epoch.EpochID, email, Revision + 1, api);
        await verifyProofOfAbsenceForRevision(absenceProof, email, epoch.TreeHash, Revision + 1);
    };
    await Promise.all([checkObsolescence(), checkAbsence()]);
};

/**
 * Check if the address is absent in key transparency by fetching the proof at revision 1.
 * If it is a valid absence proof for all revisions, the address is verifiably
 * absent in KT.
 */
export const verifyAddressIsAbsent = async (epoch: Epoch, email: string, api: Api) => {
    const absenceProof = await fetchProof(epoch.EpochID, email, 1, api);
    await verifyProofOfAbsenceForAllRevision(absenceProof, email, epoch.TreeHash);
};
