import { CryptoProxy, serverTime } from '@proton/crypto';

import { throwKTError } from '../helpers/utils';
import type { Epoch } from '../interfaces';
import { parseCertChain, parseCertTime, verifyAltName, verifyCertChain, verifySCT } from './verifyCertificates';

/**
 * Verify the consistency and correctness of an epoch
 */
export const verifyEpoch = async (epoch: Epoch) => {
    const { ChainHash, PrevChainHash, TreeHash, Certificate, EpochID, CertificateIssuer, CertificateTime } = epoch;

    // 1. Validate the certificate
    const certChain = await parseCertChain(Certificate);
    await verifyCertChain(certChain, CertificateIssuer, serverTime());
    const [epochCert, issuerCert] = certChain;
    await verifySCT(epochCert, issuerCert);

    // 2. Validate the epoch
    const checkChainHash = (
        await CryptoProxy.computeHash({
            algorithm: 'SHA256',
            data: Uint8Array.fromHex(`${PrevChainHash}${TreeHash}`),
        })
    ).toHex();
    if (ChainHash !== checkChainHash) {
        return throwKTError('Chain hash of fetched epoch is not consistent', {
            ChainHash,
            PrevChainHash,
            TreeHash,
            EpochID,
        });
    }
    await verifyAltName(epochCert, ChainHash, EpochID, CertificateTime);

    return parseCertTime(epochCert);
};
