import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { getSignedKeyListRoute, getSignedKeyListsRoute } from '@proton/shared/lib/api/keys';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { Api, FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { KT_VE_SIGNING_CONTEXT } from '../constants';
import { Epoch, Proof, VerifiedEpoch } from '../interfaces';
import { verifyEpoch } from '../verification';
import {
    getCertificateRoute,
    getEpochsRoute,
    getLatestVerifiedEpochRoute,
    getProofRoute,
    uploadVerifiedEpochRoute,
} from './api';
import { isTimestampTooOld, ktSentryReport } from './utils';

/**
 * Fetch the latest issued epoch. Note that there is no guarantee that the
 * server will return the actual latest epoch. We can only check that what
 * is returned is no older than MAX_EPOCH_INTERVAL
 */
export const fetchRecentEpoch = async (api: Api) => {
    const { Epochs } = await api<{ Epochs: Epoch[] }>(getEpochsRoute({}));
    const [lastEpoch] = Epochs;
    try {
        const certificateTimestamp = await verifyEpoch(lastEpoch);
        if (isTimestampTooOld(certificateTimestamp)) {
            ktSentryReport('Certificate timestamp of alleged latest epoch is older than MAX_EPOCH_INTERVAL', {
                context: 'fetchRecentEpoch',
                lastEpoch: JSON.stringify(lastEpoch),
                certificateTimestamp,
            });
            return;
        }
    } catch (error: any) {
        ktSentryReport('Latest epoch failed to verify', {
            context: 'fetchRecentEpoch',
            error: error.message,
        });
        return;
    }
    return lastEpoch;
};

/**
 * Fetch a specific epoch, determined by an epoch ID
 */
export const fetchEpoch = async (inputEpochID: number, api: Api): Promise<Epoch> => {
    const {
        PrevChainHash,
        Certificate,
        CertificateIssuer,
        EpochID,
        TreeHash,
        ChainHash,
        ClaimedTime,
        Domain,
        CertificateTime,
    } = await api<Epoch>(getCertificateRoute({ EpochID: inputEpochID }));
    return {
        PrevChainHash,
        Certificate,
        CertificateIssuer,
        EpochID,
        TreeHash,
        ChainHash,
        ClaimedTime,
        Domain,
        CertificateTime,
    };
};

/**
 * Fetch the KT proof of a given email address in a given epoch
 */
export const fetchProof = async (EpochID: number, Email: string, api: Api) => {
    const { Proof, CatchAllProof } = await api<{ Proof: Proof; CatchAllProof: Proof | undefined }>(
        getProofRoute({ EpochID, Email })
    );
    return {
        Proof,
        CatchAllProof,
    };
};

/**
 * Fetch all Signed Key Lists, optionally including the previous expired one, for given email and epoch
 */
export const fetchSignedKeyLists = async (
    api: Api,
    AfterEpochID: number,
    Email: string
): Promise<FetchedSignedKeyList[]> => {
    const { SignedKeyLists } = await api<{ SignedKeyLists: FetchedSignedKeyList[] }>(
        getSignedKeyListsRoute({ AfterEpochID, Email })
    );
    return SignedKeyLists;
};

/**
 * Fetch the very last SKL for the given email address
 */
export const fetchLastSKL = async (api: Api, Email: string) => {
    const { SignedKeyLists } = await api<{ SignedKeyLists: FetchedSignedKeyList[] }>(getSignedKeyListsRoute({ Email }));
    return SignedKeyLists.pop();
};

/**
 * Fetch the SKL that was committed to in a given epoch for the given email address
 */
export const fetchSKLFromEpoch = async (api: Api, EpochID: number, Email: string) => {
    try {
        const { SignedKeyList } = await api<{ SignedKeyList: FetchedSignedKeyList }>(
            getSignedKeyListRoute({ Email, EpochID })
        );
        return SignedKeyList;
    } catch (error: any) {
        // If the returned error is 422, it means that EpochID is expired
        if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
            return;
        }
        throw error;
    }
};

/**
 * Fetch the latest verified epoch
 */
export const fetchVerifiedEpoch = async (api: Api, addressID: string) => {
    try {
        const { Data, Signature } = await api<{ Data: string; Signature: string }>(
            getLatestVerifiedEpochRoute({ AddressID: addressID })
        );
        const verifiedEpoch: VerifiedEpoch = JSON.parse(Data);
        return {
            ...verifiedEpoch,
            Data,
            Signature,
        };
    } catch (error: any) {
        // If the returned error is 422, it means that the verified
        // epoch was never uploaded, e.g. because the address has just been created
        if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
            return;
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
