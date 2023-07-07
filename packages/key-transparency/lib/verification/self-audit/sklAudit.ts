import { PublicKeyReference } from '@proton/crypto';
import { FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { Epoch, Proof } from '../../interfaces';
import { verifySKLSignature } from '../verifyKeys';
import { verifyProofOfAbsenceForRevision, verifyProofOfExistenceOrObsolescence } from '../verifyProofs';

export enum SKLAuditStatus {
    Deleted,
    Obsolete,
    ExistentUnverified,
    ExistentVerified,
}

export interface SKLAuditResult {
    revision: number;
    status: SKLAuditStatus;
    sklCreationTimestamp?: Date;
    signedKeyList: FetchedSignedKeyList | null;
}

export const auditSKL = async (
    email: string,
    addressVerificationKeys: PublicKeyReference[],
    revision: number,
    signedKeyList: FetchedSignedKeyList | null,
    epoch: Epoch,
    proof: Proof
): Promise<SKLAuditResult> => {
    if (!signedKeyList) {
        await verifyProofOfAbsenceForRevision(proof, email, epoch.TreeHash, revision);
        return { revision, status: SKLAuditStatus.Deleted, signedKeyList };
    }
    await verifyProofOfExistenceOrObsolescence(proof, email, epoch.TreeHash, signedKeyList);
    if (signedKeyList.Data && signedKeyList.Signature) {
        let sklCreationTimestamp = await verifySKLSignature(
            addressVerificationKeys,
            signedKeyList.Data,
            signedKeyList.Signature
        );
        if (sklCreationTimestamp === null) {
            return { revision, status: SKLAuditStatus.ExistentUnverified, signedKeyList };
        } else {
            return { revision, status: SKLAuditStatus.ExistentVerified, sklCreationTimestamp, signedKeyList };
        }
    } else {
        return { revision, status: SKLAuditStatus.Obsolete, signedKeyList };
    }
};
