import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString, hexStringToArray } from '@proton/crypto/lib/utils';

import { throwKTError } from '../helpers/utils';
import { Epoch } from '../interfaces';
import { parseCertChain, parseCertTime, verifyAltName, verifyCertChain, verifySCT } from './verifyCertificates';

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
        return throwKTError('Chain hash of fetched epoch is not consistent', {
            ChainHash,
            PrevChainHash,
            TreeHash,
            EpochID,
        });
    }
    verifyAltName(epochCert, ChainHash, EpochID, CertificateTime);

    return parseCertTime(epochCert);
};
