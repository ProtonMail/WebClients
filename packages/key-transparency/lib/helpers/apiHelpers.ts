import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { getSignedKeyListRoute, getSignedKeyListsRoute, updateSignedKeyListRoute, updateSignedKeyListSignatureRoute } from '@proton/shared/lib/api/keys';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { Address, Api, FetchedSignedKeyList, SignedKeyList } from '@proton/shared/lib/interfaces';

import { KT_VE_SIGNING_CONTEXT, KT_VE_VERIFICATION_CONTEXT } from '../constants';
import { Epoch, Proof, VerifiedEpoch } from '../interfaces';
import { verifyEpoch } from '../verification';
import { getEpochsRoute, getLatestVerifiedEpochRoute, getProofRoute, uploadVerifiedEpochRoute } from './api';
import { isTimestampTooOld, ktSentryReport, throwKTError } from './utils';

/**
 * Fetch the latest issued epoch. Note that there is no guarantee that the
 * server will return the actual latest epoch. We can only check that what
 * is returned is no older than MAX_EPOCH_INTERVAL
 */
export const fetchLatestEpoch = async (api: Api, verify: boolean = true): Promise<Epoch> => {
    const { Epochs } = await api<{ Epochs: Epoch[] }>(getEpochsRoute({}));
    const [lastEpoch] = Epochs;
    if (verify) {
        const certificateTimestamp = await verifyEpoch(lastEpoch);
        if (isTimestampTooOld(certificateTimestamp)) {
            return throwKTError('Certificate timestamp of alleged latest epoch is older than MAX_EPOCH_INTERVAL', {
                lastEpoch: JSON.stringify(lastEpoch),
                certificateTimestamp,
            });
        }
    }
    return lastEpoch;
};

/**
 * Fetch the KT proof of a given email address in a given epoch
 */
export const fetchProof = async (EpochID: number, Email: string, Revision: number, api: Api) => {
    const { Proof } = await api<{ Proof: Proof }>(getProofRoute({ EpochID, Email, Revision }));
    return Proof;
};

/**
 * Fetch all Signed Key Lists that have a revision > AfterRevision, for given email
 */
export const fetchSignedKeyLists = async (
    api: Api,
    AfterRevision: number,
    Identifier: string
): Promise<FetchedSignedKeyList[]> => {
    const { SignedKeyLists } = await api<{ SignedKeyLists: FetchedSignedKeyList[] }>(
        getSignedKeyListsRoute({ AfterRevision, Identifier })
    );
    return SignedKeyLists;
};

export const updateSignedKeyList = async (
    api: Api,
    addressID: string,
    signedKeyList: SignedKeyList
): Promise<FetchedSignedKeyList> => {
    const { SignedKeyList } = await api<{ SignedKeyList: FetchedSignedKeyList }>(
        updateSignedKeyListRoute({ AddressID: addressID, SignedKeyList: signedKeyList })
    );
    return SignedKeyList;
};

/**
 * Fetch the Signed key list, for given email and revision
 */
export const fetchSignedKeyList = async (
    api: Api,
    Revision: number,
    Identifier: string
): Promise<FetchedSignedKeyList | null> => {
    try {
        const { SignedKeyList } = await api<{ SignedKeyList: FetchedSignedKeyList }>(
            getSignedKeyListRoute({ Revision, Identifier })
        );
        return SignedKeyList;
    } catch (error: any) {
        // If the returned error is 422, it means that the revision doesn't exist
        if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
            return null;
        }
        throw error;
    }
};

/**
 * Fetch the latest verified epoch
 */
export const fetchVerifiedEpoch = async (
    address: Address,
    api: Api,
    userVerificationKeys?: PublicKeyReference[]
): Promise<VerifiedEpoch | null> => {
    try {
        const { Data, Signature } = await api<{ Data: string; Signature: string }>(
            getLatestVerifiedEpochRoute({ AddressID: address.ID })
        );
        if (userVerificationKeys?.length) {
            const { verified, errors } = await CryptoProxy.verifyMessage({
                armoredSignature: Signature,
                verificationKeys: userVerificationKeys,
                textData: Data,
                context: KT_VE_VERIFICATION_CONTEXT,
            });
            if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                ktSentryReport('Verified epoch signature verification failed', {
                    errors: JSON.stringify(errors),
                    email: address.Email,
                });
                return null;
            }
        }
        const verifiedEpochData: VerifiedEpoch = JSON.parse(Data);
        return verifiedEpochData;
    } catch (error: any) {
        // If the returned error is 422, it means that the verified
        // epoch was never uploaded, e.g. because the address has just been created
        if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
            return null;
        }
        throw error;
    }
};

/**
 * Fetch the latest verified epoch
 */
export const fetchVerifiedEpochWithoutVerification = async (
    address: Address,
    userVerificationKeys: PublicKeyReference[],
    api: Api
): Promise<VerifiedEpoch | null> => {
    try {
        const { Data } = await api<{ Data: string; Signature: string }>(
            getLatestVerifiedEpochRoute({ AddressID: address.ID })
        );
        const verifiedEpochData: VerifiedEpoch = JSON.parse(Data);
        return verifiedEpochData;
    } catch (error: any) {
        // If the returned error is 422, it means that the verified
        // epoch was never uploaded, e.g. because the address has just been created
        if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
            return null;
        }
        throw error;
    }
};

/**
 * Upload a verified epoch
 */
export const uploadVerifiedEpoch = async (
    verifiedEpoch: VerifiedEpoch,
    AddressID: string,
    signingKeys: PrivateKeyReference,
    api: Api
) => {
    const bodyData = JSON.stringify(verifiedEpoch);

    await api(
        uploadVerifiedEpochRoute({
            AddressID,
            Data: bodyData,
            Signature: await CryptoProxy.signMessage({
                textData: bodyData,
                signingKeys,
                detached: true,
                context: KT_VE_SIGNING_CONTEXT,
            }),
        })
    );
};

/**
 * Update the signature for an existing SKL
 */
export const updateSignedKeyListSignature = async (
    addressID: string,
    revision: number,
    newSignature: string,
    api: Api
) => {
    await api(
        updateSignedKeyListSignatureRoute({
            AddressID: addressID,
            Revision: revision,
            Signature: newSignature,
        })
    );
};
