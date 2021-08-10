import { getKeys, signMessage } from 'pmcrypto';
import { getSignedKeyLists } from './helpers/api/keys';
import {
    getCertificate,
    getEpochs,
    getLatestVerifiedEpoch,
    getProof,
    uploadVerifiedEpoch,
} from './helpers/api/keyTransparency';
import { Address } from './helpers/interfaces/Address';
import { Api } from './helpers/interfaces/Api';
import { SignedKeyListEpochs } from './helpers/interfaces/SignedKeyList';
import { Epoch, EpochExtended, Proof } from './interfaces';

const cachedEpochs: Map<number, Epoch> = new Map();

export async function fetchLastEpoch(api: Api) {
    const epoch: { Code: number; Epochs: Epoch[] } = await api(getEpochs({}));
    if (epoch.Code === 1000) {
        return epoch.Epochs[0].EpochID;
    }
    throw new Error('Fetching last epoch failed');
}

export async function fetchEpoch(epochID: number, api: Api) {
    const cachedEpoch = cachedEpochs.get(epochID);
    if (cachedEpoch) {
        return cachedEpoch;
    }

    const { Code: code, ...epoch } = await api(getCertificate({ EpochID: epochID }));
    if (code === 1000) {
        cachedEpochs.set(epochID, epoch as Epoch);
        return epoch as Epoch;
    }
    throw new Error(epoch.Error);
}

export async function fetchProof(epochID: number, email: string, api: Api) {
    const { Code: code, ...proof } = await api(getProof({ EpochID: epochID, Email: email }));
    if (code === 1000) {
        return proof as Proof;
    }
    throw new Error(proof.Error);
}

export async function getParsedSignedKeyLists(
    api: Api,
    epochID: number,
    email: string,
    includeLastExpired: boolean
): Promise<SignedKeyListEpochs[]> {
    const { Code: code, ...fetchedSKLs } = await api(getSignedKeyLists({ SinceEpochID: epochID, Email: email }));
    /*
    fetchedSKLs.SignedKeyLists contains:
        - the last expired SKL, i.e. the newest SKL such that MinEpochID <= SinceEpochID
        - all SKLs such that MinEpochID > SinceEpochID
        - the latest SKL, i.e. such that MinEpochID is null
    in chronological order.
    */
    if (code === 1000) {
        return fetchedSKLs.SignedKeyLists.slice(includeLastExpired ? 0 : 1);
    }
    throw new Error(fetchedSKLs.Error);
}

export async function getVerifiedEpoch(
    api: Api,
    addressID: string
): Promise<{ Data: string; Signature: string } | undefined> {
    let verifiedEpoch;
    let code;
    try {
        const { Code: c, ...vE } = await api(getLatestVerifiedEpoch({ AddressID: addressID }));
        code = c;
        verifiedEpoch = vE;
    } catch (err) {
        return;
    }

    if (code === 1000) {
        return verifiedEpoch as { Data: string; Signature: string };
    }
    throw new Error(verifiedEpoch.Error);
}

export async function uploadEpoch(epoch: EpochExtended, address: Address, api: Api) {
    const bodyData = JSON.stringify({
        EpochID: epoch.EpochID,
        ChainHash: epoch.ChainHash,
        CertificateDate: epoch.CertificateDate,
    });

    const [privateKey] = address.Keys.map((key) => key.PrivateKey);
    await api(
        uploadVerifiedEpoch({
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
}
