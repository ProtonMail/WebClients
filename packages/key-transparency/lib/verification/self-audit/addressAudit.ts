import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type {
    ActiveSignedKeyList,
    Address,
    Api,
    DecryptedAddressKey,
    FetchedSignedKeyList,
    KTUserContext,
    KeyPair,
} from '@proton/shared/lib/interfaces';
import { getSignedKeyListSignature } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import {
    fetchProof,
    fetchSignedKeyLists,
    fetchVerifiedEpoch,
    updateSignedKeyListSignature,
    uploadVerifiedEpoch,
} from '../../helpers/apiHelpers';
import { KeyTransparencyError, throwKTError } from '../../helpers/utils';
import type { AddressAuditResult, Epoch, VerifiedEpoch } from '../../interfaces';
import { AddressAuditStatus, AddressAuditWarningReason } from '../../interfaces';
import { saveSKLToLS } from '../../storage';
import { checkKeysInSKL, verifySKLSignature } from '../verifyKeys';
import {
    verifyProofOfAbsenceForAllRevision,
    verifyProofOfAbsenceForRevision,
    verifyProofOfObsolescence,
} from '../verifyProofs';
import type { SKLAuditResult } from './sklAudit';
import { SKLAuditStatus, auditSKL } from './sklAudit';
import { uploadMissingSKL } from './uploadMissingSKL';

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
        await verifyProofOfAbsenceForRevision(proof, address.Email, epoch.TreeHash, inputSKL.Revision + 1);
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

const successOrWarning = (email: string, sklAudits: SKLAuditResult[], signatureWasInTheFuture: boolean) => {
    const addressWasDisabled = sklAudits.filter((audit) => audit.status === SKLAuditStatus.Obsolete).length != 0;
    const numberOfFailedSig = sklAudits.filter((audit) => audit.status === SKLAuditStatus.ExistentUnverified).length;
    /**
     * If the SKL sig was in the future (and got fixed), then we don't show a warning.
     */
    const sklVerificationFailed = numberOfFailedSig > 1 || (numberOfFailedSig == 1 && !signatureWasInTheFuture);
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

/**
 * Some SKL will fail verification because
 * they were signed with a time in the future.
 * In this case we resign them.
 */
const checkAndFixSKLInTheFuture = async (address: Address, primaryAddressKey: PrivateKeyReference, api: Api) => {
    const { Email, ID, SignedKeyList } = address;
    const { Revision, Data, Signature } = SignedKeyList!;
    if (Revision === 1) {
        const signatureIsInTheFuture = await verifySKLSignature(
            [primaryAddressKey],
            Data,
            Signature,
            new Date(0xffffffff * 1000) // max date in the future
        );
        if (signatureIsInTheFuture) {
            const newSignature = await getSignedKeyListSignature(Data, primaryAddressKey);
            await updateSignedKeyListSignature(ID, Revision, newSignature, api);
            return;
        }
    }
    return throwKTError('Input SKL signature was not verified', { email: Email, inputSKL: SignedKeyList });
};

/**
 * An admin can create an address with no keys that cannot be audited
 * we verify the absence or obsolescence proof, and will warn the user in
 * in the UI.
 */
const checkAddressWithNoKeys = async ({
    userContext,
    epoch,
    address,
    api,
}: {
    userContext: KTUserContext;
    epoch: Epoch;
    address: Address;
    api: Api;
}) => {
    const inputSKL = address.SignedKeyList;
    const revisionToCheck = inputSKL?.Revision ?? 1;
    const proof = await fetchProof(epoch.EpochID, address.Email, revisionToCheck, api);
    if (!inputSKL) {
        await verifyProofOfAbsenceForAllRevision(proof, address.Email, epoch.TreeHash);
        return;
    }
    if (!inputSKL.ObsolescenceToken) {
        return throwKTError('Expected an obsolescence token for an address without keys', {
            inputSKL,
        });
    }
    // If MinEpochID is not set, the SKL is not yet included in KT.
    if (!inputSKL.MinEpochID) {
        if (!inputSKL.Revision || !inputSKL.ExpectedMinEpochID) {
            return throwKTError('Expected an ExpectedMinEpochID and Revision', {
                inputSKL,
            });
        }
        await saveSKLToLS({
            userContext,
            email: address.Email,
            data: inputSKL.ObsolescenceToken!,
            revision: inputSKL.Revision!,
            expectedMinEpochID: inputSKL.ExpectedMinEpochID!,
            addressID: address.ID,
            isCatchall: false,
        });
        return;
    }
    // Check that proof is a valid obsolescence proof.
    await verifyProofOfObsolescence(proof, address.Email, epoch.TreeHash, inputSKL);

    // The proof of the next revision must be an absence proof.
    const absenceProof = await fetchProof(epoch.EpochID, address.Email, revisionToCheck + 1, api);
    await verifyProofOfAbsenceForRevision(absenceProof, address.Email, epoch.TreeHash, revisionToCheck + 1);
};

const auditAddressImplementation = async ({
    address,
    userKeys,
    addressKeys,
    epoch,
    api,
    userContext,
}: {
    userContext: KTUserContext;
    address: Address;
    userKeys: KeyPair[];
    addressKeys: DecryptedAddressKey[];
    epoch: Epoch;
    api: Api;
}): Promise<AddressAuditResult> => {
    const inputSKL = address.SignedKeyList;
    const email = address.Email;
    if (address.Keys.length === 0) {
        await checkAddressWithNoKeys({ epoch, address, api, userContext });
        return {
            email,
            status: AddressAuditStatus.Warning,
            warningDetails: {
                reason: AddressAuditWarningReason.AddressWithNoKeys,
            },
        };
    }
    if (inputSKL === null) {
        await uploadMissingSKL({ address, epoch, api, userContext });
        return {
            email,
            status: AddressAuditStatus.Success,
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
    const verifiedEpoch = await fetchVerifiedEpoch(address, api, userVerificationKeys);

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
    const addressVerificationKeys = addressKeys
        .filter(({ Flags }) => hasBit(Flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
        .map(({ publicKey }) => publicKey);

    const sklAudits = await Promise.all(
        range(verifiedRevision + 1, lastIncludedRevision).map((revision) => {
            const skl = newSKLs.find((skl) => skl.Revision == revision);
            const proof = proofs.find(({ revision: proofRevision }) => proofRevision == revision)?.proof!;
            return auditSKL(email, addressVerificationKeys, revision, skl ?? null, epoch, proof);
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
    await verifyProofOfAbsenceForRevision(nextRevisionProof, email, epoch.TreeHash, lastIncludedRevision + 1);

    const audit = sklAudits.find(({ revision }) => revision === inputSKL.Revision);
    let signatureWasInTheFuture = false;
    if (audit) {
        if (audit.signedKeyList?.Data !== inputSKL.Data) {
            return throwKTError('Audited SKL doesnt match the input SKL', { email, inputSKL });
        }
        if (audit.status !== SKLAuditStatus.ExistentVerified) {
            const primaryAddressKey = addressKeys[0].privateKey;
            await checkAndFixSKLInTheFuture(address, primaryAddressKey, api);
            signatureWasInTheFuture = true;
        }
    } else {
        const verified = await verifySKLSignature(addressVerificationKeys, inputSKL.Data, inputSKL.Signature);
        if (verified === null) {
            const primaryAddressKey = addressKeys[0].privateKey;
            await checkAndFixSKLInTheFuture(address, primaryAddressKey, api);
            signatureWasInTheFuture = true;
        }
        const expectedMinEpochID = inputSKL.MinEpochID ?? inputSKL.ExpectedMinEpochID;
        if (!expectedMinEpochID) {
            return throwKTError('Input SKL has not minEpochID or expectedMinEpochID', { email, inputSKL });
        }
        await saveSKLToLS({
            userContext,
            email,
            data: inputSKL.Data,
            revision: inputSKL.Revision,
            expectedMinEpochID,
            addressID: address.ID,
            isCatchall: false,
        });
    }

    const addressKeysWithoutForwarding = (
        await Promise.all(
            addressKeys.map(async ({ Flags, privateKey, Primary }) => {
                const result = await CryptoProxy.isE2EEForwardingKey({ key: privateKey });
                return result ? false : { flags: Flags, key: privateKey, primary: Primary };
            })
        )
    ).filter(isTruthy);

    await checkKeysInSKL(email, addressKeysWithoutForwarding, inputSKL.Data);

    await uploadNewVerifiedEpoch(sklAudits, epoch, address, userPrimaryKey, api);

    return successOrWarning(email, sklAudits, signatureWasInTheFuture);
};

export const auditAddress = async ({
    userContext,
    address,
    addressKeys,
    api,
    userKeys,
    epoch,
}: {
    userContext: KTUserContext;
    address: Address;
    userKeys: KeyPair[];
    addressKeys: DecryptedAddressKey[];
    epoch: Epoch;
    api: Api;
}): Promise<AddressAuditResult> => {
    try {
        return await auditAddressImplementation({
            userContext,
            address,
            userKeys,
            addressKeys,
            epoch,
            api,
        });
    } catch (error: any) {
        if (error instanceof KeyTransparencyError) {
            return { email: address.Email, status: AddressAuditStatus.Failure, error };
        }
        throw error;
    }
};
