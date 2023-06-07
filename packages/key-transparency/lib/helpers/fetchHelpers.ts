import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { getSignedKeyListRoute, getSignedKeyListsRoute } from '@proton/shared/lib/api/keys';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { Address, Api, FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

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
export const fetchAndVerifyLatestEpoch = async (api: Api): Promise<Epoch> => {
    const { Epochs } = await api<{ Epochs: Epoch[] }>(getEpochsRoute({}));
    const [lastEpoch] = Epochs;
    const certificateTimestamp = await verifyEpoch(lastEpoch);
    if (isTimestampTooOld(certificateTimestamp)) {
        return throwKTError('Certificate timestamp of alleged latest epoch is older than MAX_EPOCH_INTERVAL', {
            lastEpoch: JSON.stringify(lastEpoch),
            certificateTimestamp,
        });
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
    Email: string
): Promise<FetchedSignedKeyList[]> => {
    const { SignedKeyLists } = await api<{ SignedKeyLists: FetchedSignedKeyList[] }>(
        getSignedKeyListsRoute({ AfterRevision, Email })
    );
    return SignedKeyLists;
};

/**
 * Fetch the Signed key list, for given email and revision
 */
export const fetchSignedKeyList = async (
    api: Api,
    Revision: number,
    Email: string
): Promise<FetchedSignedKeyList | null> => {
    try {
        const { SignedKeyList } = await api<{ SignedKeyList: FetchedSignedKeyList }>(
            getSignedKeyListRoute({ Revision, Email })
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
    userVerificationKeys: PublicKeyReference[],
    api: Api
): Promise<VerifiedEpoch | null> => {
    try {
        const { Data, Signature } = await api<{ Data: string; Signature: string }>(
            getLatestVerifiedEpochRoute({ AddressID: address.ID })
        );
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
