import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString, hexStringToArray } from '@proton/crypto/lib/utils';
import { Api, FetchedSignedKeyList } from '@proton/shared/lib/interfaces';

import { fetchEpoch } from '../helpers/fetchHelpers';
import { ktSentryReport } from '../helpers/utils';
import { Epoch } from '../interfaces';
import { parseCertChain, parseCertTime, verifyAltName, verifyCertChain, verifySCT } from './verifyCertificates';
import { verifySKLExistence } from './verifyProofs';

/**
 * Verify the consistency and correctness of an epoch
 */
export const verifyEpoch = async (epoch: Epoch) => {
    const { ChainHash, PrevChainHash, TreeHash, Certificate, EpochID, CertificateIssuer, CertificateTime } = epoch;

    // 1. Validate the certificate
    const certChain = parseCertChain(Certificate);
    await verifyCertChain(certChain, CertificateIssuer);
    const [epochCert, issuerCert] = certChain;
    await verifySCT(epochCert, issuerCert);

    // 2. Validate the epoch
    const checkChainHash = arrayToHexString(
        await CryptoProxy.computeHash({
            algorithm: 'SHA256',
            data: hexStringToArray(`${PrevChainHash}${TreeHash}`),
        })
    );
    if (ChainHash !== checkChainHash) {
        ktSentryReport('Chain hash of fetched epoch is not consistent', {
            context: 'verifyEpoch',
            ChainHash,
            PrevChainHash,
            TreeHash,
            EpochID,
        });
        throw new Error('Chain hash of fetched epoch is not consistent');
    }
    verifyAltName(epochCert, ChainHash, EpochID, CertificateTime);

    return parseCertTime(epochCert);
};

/**
 * Verify a signed key list is correctly present in a given epoch
 * and verify the latter
 */
export const verifySKLInsideEpoch = async (
    epoch: Epoch,
    email: string,
    signedKeyList: FetchedSignedKeyList,
    api: Api,
    bumpEpochID: boolean = false
): Promise<{
    certificateTimestamp: number;
    Revision: number;
    ObsolescenceToken: string | null;
    epochIDBumped?: boolean;
}> => {
    let certificateTimestamp: number;
    try {
        certificateTimestamp = await verifyEpoch(epoch);
    } catch (error: any) {
        // There might be a race condition with the epoch, i.e. its certificate
        // was valid when BE returned it but is expired by the time it is checked.
        // The caller signals this can be an issue by setting the bumpEpochID flag,
        // therefore if this is the case we retry verification with the epoch whose
        // EpochID is the current's + 1.
        if (bumpEpochID && error?.message === 'Epoch certificate is expired') {
            const nextEpoch = await fetchEpoch(epoch.EpochID + 1, api);
            const { certificateTimestamp, Revision, ObsolescenceToken } = await verifySKLInsideEpoch(
                nextEpoch,
                email,
                signedKeyList,
                api
            );
            return { certificateTimestamp, Revision, ObsolescenceToken, epochIDBumped: true };
        }
        throw error;
    }

    // 3. Validate the proof
    const { Revision, ObsolescenceToken } = await verifySKLExistence(api, epoch, email, signedKeyList);

    // 4. Return the notBefore date of the certificate.
    return { certificateTimestamp, Revision, ObsolescenceToken };
};

/**
 * Verify a signed key list is correctly present in the epoch identified
 * by the given epoch ID and verify the latter
 */
export const verifySKLInsideEpochID = async (
    epochID: number,
    email: string,
    signedKeyList: FetchedSignedKeyList,
    api: Api,
    bumpEpochID: boolean = false
) => {
    const epoch = await fetchEpoch(epochID, api);
    return verifySKLInsideEpoch(epoch, email, signedKeyList, api, bumpEpochID);
};
