import { getKeys, signMessage } from 'pmcrypto';
import { Api, Address, SignedKeyListEpochs } from '@proton/shared/lib/interfaces';
import { getSignedKeyListsRoute } from '@proton/shared/lib/api/keys';
import {
    getCertificateRoute,
    getEpochsRoute,
    getLatestVerifiedEpochRoute,
    getProofRoute,
    uploadVerifiedEpochRoute,
} from '@proton/shared/lib/api/keyTransparency';
import { API_CODES } from '@proton/shared/lib/constants';
import { Epoch, EpochExtended, Proof } from './interfaces';

/**
 * Fetch the latest issued epoch
 */
export const fetchLastEpoch = async (api: Api) => {
    const { Code, Epochs } = await api(getEpochsRoute({}));
    if (Code === API_CODES.SINGLE_SUCCESS) {
        return Epochs[0].EpochID as number;
    }
    throw new Error('Fetching last epoch failed');
};

/**
 * Fetch a specific epoch, determined by an epoch ID
 */
export const fetchEpoch = async (EpochID: number, api: Api) => {
    const { Code, ...epoch } = await api(getCertificateRoute({ EpochID }));
    if (Code === API_CODES.SINGLE_SUCCESS) {
        return epoch as Epoch;
    }
    throw new Error(epoch.Error);
};

/**
 * Fetch the KT proof of a given email address in a given epoch
 */
export const fetchProof = async (EpochID: number, Email: string, api: Api) => {
    const { Code, ...proof } = await api(getProofRoute({ EpochID, Email }));
    if (Code === API_CODES.SINGLE_SUCCESS) {
        return proof as Proof;
    }
    throw new Error(proof.Error);
};

/**
 * Fetch all Signed Key Lists, optionally including the previous expired one, for given email and epoch
 */
export const fetchParsedSKLs = async (
    api: Api,
    epochID: number,
    email: string,
    includeLastExpired: boolean
): Promise<SignedKeyListEpochs[]> => {
    const { Code, ...fetchedSKLs } = await api(getSignedKeyListsRoute({ SinceEpochID: epochID, Email: email }));
    /*
    fetchedSKLs.SignedKeyLists contains:
        - the last expired SKL, i.e. the newest SKL such that MinEpochID <= SinceEpochID
        - all SKLs such that MinEpochID > SinceEpochID
        - the latest SKL, i.e. such that MinEpochID is null
    in chronological order.
    */
    if (Code === API_CODES.SINGLE_SUCCESS) {
        return fetchedSKLs.SignedKeyLists.slice(includeLastExpired ? 0 : 1);
    }
    throw new Error(fetchedSKLs.Error);
};

/**
 * Fetch the latest verified epoch
 */
export const fetchVerifiedEpoch = async (api: Api, addressID: string) => {
    const { Code, ...packedVerifiedEpoch } = await api(getLatestVerifiedEpochRoute({ AddressID: addressID }));
    if (Code === API_CODES.SINGLE_SUCCESS) {
        return packedVerifiedEpoch as { Data: string; Signature: string };
    }
    throw new Error(packedVerifiedEpoch.Error);
};

/**
 * Upload a verified epoch
 */
export const uploadEpoch = async (epoch: EpochExtended, address: Address, api: Api) => {
    const bodyData = JSON.stringify({
        EpochID: epoch.EpochID,
        ChainHash: epoch.ChainHash,
        CertificateDate: epoch.CertificateDate,
    });

    const [privateKey] = address.Keys.map((key) => key.PrivateKey);
    await api(
        uploadVerifiedEpochRoute({
            AddressID: address.ID,
            Data: bodyData,
            Signature: (
                await signMessage({
                    data: bodyData,
                    privateKeys: await getKeys(privateKey),
                    detached: true,
                })
            ).signature,
        })
    );
};
