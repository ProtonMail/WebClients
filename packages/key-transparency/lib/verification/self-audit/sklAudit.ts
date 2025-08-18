import type { PublicKeyReference } from '@proton/crypto';
import type { FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import type { Epoch, Proof } from '../../interfaces';
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
        const sklCreationTimestamp = await verifySKLSignature({
            verificationKeys: addressVerificationKeys,
            signedKeyListData: signedKeyList.Data,
            signedKeyListSignature: signedKeyList.Signature,
        });
        if (sklCreationTimestamp === null) {
            return { revision, status: SKLAuditStatus.ExistentUnverified, signedKeyList };
        } else {
            return { revision, status: SKLAuditStatus.ExistentVerified, sklCreationTimestamp, signedKeyList };
        }
    } else {
        return { revision, status: SKLAuditStatus.Obsolete, signedKeyList };
    }
};
