import { PrivateKeyReference } from '@proton/crypto';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    ActiveSignedKeyList,
    Address,
    Api,
    DecryptedKey,
    FetchedSignedKeyList,
    SaveSKLToLS,
} from '@proton/shared/lib/interfaces';

import { fetchProof, fetchSignedKeyLists, fetchVerifiedEpoch, uploadVerifiedEpoch } from '../../helpers/fetchHelpers';
import { KeyTransparencyError, throwKTError } from '../../helpers/utils';
import {
    AddressAuditResult,
    AddressAuditStatus,
    AddressAuditWarningReason,
    Epoch,
    VerifiedEpoch,
} from '../../interfaces';
import { checkKeysInSKL, importKeys, verifySKLSignature } from '../verifyKeys';
import { verifyProofOfAbscenceForRevision } from '../verifyProofs';
import { SKLAuditResult, SKLAuditStatus, auditSKL } from './sklAudit';

const millisecondsToSeconds = (milliseconds: number) => Math.floor(milliseconds / 1000);
const secondsToMilliseconds = (seconds: number) => seconds * 1000;

const findLastIncludedSKL = (newSKLs: FetchedSignedKeyList[], epoch: Epoch): FetchedSignedKeyList | null => {
    const includedSKLs = newSKLs.filter(({ MinEpochID }) => MinEpochID !== null && MinEpochID <= epoch.EpochID);
    if (includedSKLs.length) {
        return includedSKLs.reduce((maxRevisionSKL, currentSKL) => {
            if (maxRevisionSKL.Revision > currentSKL.Revision) {
                return maxRevisionSKL;
            }
            return currentSKL;
        });
    }
    return null;
};

// Both bounds are included
const range = (begin: number, end: number) => {
    if (begin > end) {
        return [];
    }
    return [...Array(end - begin + 1).keys()].map((i) => begin + i);
};

const isMonotonicallyIncreasing = <T>(elements: T[], start: T): boolean => {
    var lowerBound = start;
    for (const element of elements) {
        if (element < lowerBound) {
            return false;
        }
        lowerBound = element;
    }
    return true;
};

const uploadNewVerifiedEpoch = async (
    sklAudits: SKLAuditResult[],
    epoch: Epoch,
    address: Address,
    userPrimaryKey: PrivateKeyReference,
    api: Api
) => {
    if (sklAudits.length) {
        const maxRevisionAudit = sklAudits[sklAudits.length - 1];
        if (maxRevisionAudit.status === SKLAuditStatus.ExistentVerified) {
            await uploadVerifiedEpoch(
                {
                    EpochID: epoch.EpochID,
                    Revision: maxRevisionAudit.revision,
                    SKLCreationTime: millisecondsToSeconds(+maxRevisionAudit.sklCreationTimestamp!),
                },
                address.ID,
                userPrimaryKey,
                api
            );
        }
    }
};

const earlyTermination = async (
    verifiedEpoch: VerifiedEpoch,
    epoch: Epoch,
    address: Address,
    inputSKL: ActiveSignedKeyList,
    userPrimaryKey: PrivateKeyReference,
    api: Api
) => {
    if (verifiedEpoch.EpochID === epoch.EpochID) {
        return true;
    }
    if (verifiedEpoch.Revision === inputSKL.Revision) {
        const proof = await fetchProof(epoch.EpochID, address.Email, inputSKL.Revision + 1, api);
        await verifyProofOfAbscenceForRevision(proof, address.Email, epoch.TreeHash, inputSKL.Revision + 1);
        await uploadVerifiedEpoch(
            {
                EpochID: epoch.EpochID,
                Revision: verifiedEpoch.Revision,
                SKLCreationTime: verifiedEpoch.SKLCreationTime,
            },
            address.ID,
            userPrimaryKey,
            api
        );
        return true;
    }
    return false;
};

const successOrWarning = (email: string, sklAudits: SKLAuditResult[]) => {
    const addressWasDisabled = sklAudits.filter((audit) => audit.status === SKLAuditStatus.Obsolete).length != 0;
    const sklVerificationFailed =
        sklAudits.filter((audit) => audit.status === SKLAuditStatus.ExistentUnverified).length != 0;
    if (addressWasDisabled || sklVerificationFailed) {
        return {
            email,
            status: AddressAuditStatus.Warning,
            warningDetails: {
                reason: AddressAuditWarningReason.UnverifiableHistory,
                addressWasDisabled,
                sklVerificationFailed,
            },
        };
    }
    return { email, status: AddressAuditStatus.Success };
};

const auditAddressImplementation = async (
    address: Address,
    userKeys: DecryptedKey[],
    epoch: Epoch,
    saveSKLToLS: SaveSKLToLS,
    api: Api
): Promise<AddressAuditResult> => {
    const inputSKL = address.SignedKeyList;
    const email = address.Email;
    if (inputSKL === null) {
        return {
            email,
            status: AddressAuditStatus.Warning,
            warningDetails: { reason: AddressAuditWarningReason.NullSKL },
        };
    }
    if (!inputSKL.Revision) {
        return throwKTError('Input SKL has no revision set', { email, inputSKL });
    }
    if (!userKeys.length) {
        return throwKTError('Account key list was empty', { email });
    }
    const userPrimaryKey = userKeys[0].privateKey;
    const userVerificationKeys = userKeys.map(({ publicKey }) => publicKey);
    const verifiedEpoch = await fetchVerifiedEpoch(address, userVerificationKeys, api);

    if (verifiedEpoch && (await earlyTermination(verifiedEpoch, epoch, address, inputSKL, userPrimaryKey, api))) {
        return { email, status: AddressAuditStatus.Success };
    }

    const verifiedRevision = verifiedEpoch?.Revision ?? 0;
    const newSKLs = await fetchSignedKeyLists(api, verifiedEpoch?.Revision ?? 0, email);
    const lastIncludedRevision = findLastIncludedSKL(newSKLs, epoch)?.Revision ?? verifiedRevision;
    const proofs = await Promise.all(
        range(verifiedRevision + 1, lastIncludedRevision + 1).map((revision) => {
            const proofPromise = fetchProof(epoch.EpochID, email, revision, api);
            return proofPromise.then((proof) => {
                return { revision, proof };
            });
        })
    );
    const addressKeys = await importKeys(address.Keys.filter(({ Active }) => Active === 1));
    const addressVerificationKeys = addressKeys.filter(({ Flags }) => hasBit(Flags, KEY_FLAG.FLAG_NOT_COMPROMISED));

    const sklAudits = await Promise.all(
        range(verifiedRevision + 1, lastIncludedRevision).map((revision) => {
            const skl = newSKLs.find((skl) => skl.Revision == revision);
            const proof = proofs.find(({ revision: proofRevision }) => proofRevision == revision)?.proof!;
            return auditSKL(
                email,
                addressVerificationKeys.map(({ PublicKey }) => PublicKey),
                revision,
                skl ?? null,
                epoch,
                proof
            );
        })
    );

    const minEpochIDs = newSKLs.map((skl) => skl.MinEpochID).filter((minEpochID) => minEpochID != null);
    const minEpochIDsIncrease = isMonotonicallyIncreasing(minEpochIDs, verifiedEpoch?.EpochID ?? 0);
    if (!minEpochIDsIncrease) {
        return throwKTError('MinEpochIDs are not increasing', { email, minEpochIDs });
    }

    const sklCreationTimestamps = sklAudits
        .map(({ sklCreationTimestamp }) => sklCreationTimestamp)
        .filter((timestamp) => timestamp !== undefined);
    const sklCreationTimestampsIncrease = isMonotonicallyIncreasing(
        sklCreationTimestamps,
        new Date(secondsToMilliseconds(verifiedEpoch?.SKLCreationTime ?? 0))
    );
    if (!sklCreationTimestampsIncrease) {
        return throwKTError('SKL timestamps are not increasing', { email, sklCreationTimestamps });
    }

    const nextRevisionProof = proofs.find(({ revision }) => revision === lastIncludedRevision + 1)?.proof!;
    await verifyProofOfAbscenceForRevision(nextRevisionProof, email, epoch.TreeHash, lastIncludedRevision + 1);

    const audit = sklAudits.find(({ revision }) => revision === inputSKL.Revision);
    if (audit) {
        if (audit.signedKeyList?.Data !== inputSKL.Data) {
            return throwKTError('Audited SKL doesnt match the input SKL', { email, inputSKL });
        }
        if (audit.status !== SKLAuditStatus.ExistentVerified) {
            return throwKTError('Input SKL signature was not verified', { email, inputSKL });
        }
    } else {
        const verified = await verifySKLSignature(
            addressVerificationKeys.map(({ PublicKey }) => PublicKey),
            inputSKL.Data,
            inputSKL.Signature
        );
        if (verified === null) {
            return throwKTError('Input SKL signature was not verified', { email, inputSKL });
        }
        const expectedMinEpochID = inputSKL.MinEpochID ?? inputSKL.ExpectedMinEpochID;
        if (!expectedMinEpochID) {
            return throwKTError('Input SKL has not minEpochID or expectedMinEpochID', { email, inputSKL });
        }
        await saveSKLToLS(email, inputSKL.Data, inputSKL.Revision, expectedMinEpochID, address.ID);
    }

    await checkKeysInSKL(email, addressKeys, inputSKL.Data);

    await uploadNewVerifiedEpoch(sklAudits, epoch, address, userPrimaryKey, api);

    return successOrWarning(email, sklAudits);
};

export const auditAddress = async (
    address: Address,
    userKeys: DecryptedKey[],
    epoch: Epoch,
    saveSKLToLS: SaveSKLToLS,
    api: Api
): Promise<AddressAuditResult> => {
    try {
        return await auditAddressImplementation(address, userKeys, epoch, saveSKLToLS, api);
    } catch (error: any) {
        if (error instanceof KeyTransparencyError) {
            return { email: address.Email, status: AddressAuditStatus.Failure, error };
        }
        throw error;
    }
};
