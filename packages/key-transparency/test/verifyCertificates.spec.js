import { Integer as asn1jsInteger } from 'asn1js';

import { HOUR, SECOND, YEAR } from '@proton/shared/lib/constants';

import { KT_CERTIFICATE_ISSUER } from '../lib/constants/constants';
import {
    parseCertChain,
    parseCertificate,
    verifyAltName,
    verifyCertChain,
    verifySCT,
} from '../lib/verification/verifyCertificates';
import { epoch } from './epoch.data';
import { letsEncryptCertificateChain, zeroSSLCertificateChain } from './verifyCertificate.data';

describe('certificate transparency', () => {
    it('should fail to parse with corrupt certificate', async () => {
        let errorThrown = true;
        try {
            await parseCertificate('corrupt');
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual("Object's schema was not verified against input data for Certificate");
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifyAltName with missing extensions', async () => {
        const { Certificate, ChainHash, EpochID, CertificateTime } = epoch;
        const [cert] = await parseCertChain(Certificate);
        const { extensions, ...certNoExt } = cert;

        let errorThrown = true;
        try {
            await verifyAltName(certNoExt, ChainHash, EpochID, CertificateTime);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate does not have extensions');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifyAltName with missing AltName extension', async () => {
        const { Certificate, ChainHash, EpochID, CertificateTime } = epoch;
        const [cert] = await parseCertChain(Certificate);
        const corruptExt = cert.extensions.filter((ext) => ext.extnID !== '2.5.29.17');

        let errorThrown = true;
        try {
            await verifyAltName({ ...cert, extensions: corruptExt }, ChainHash, EpochID, CertificateTime);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate does not have AltName extension');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifySCT with corrupt certificate', async () => {
        const { Certificate } = epoch;
        const certChain = await parseCertChain(Certificate);
        const epochCert = certChain[0];
        const issuerCert = certChain[1];
        epochCert.serialNumber = new asn1jsInteger();

        let errorThrown = true;
        try {
            await verifySCT(epochCert, issuerCert);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('SCT verification failed');
        }
        expect(errorThrown).toEqual(true);
    });
});

describe('certificate chain verification', () => {
    it('Should verify 0SSL certificate', async () => {
        const now = new Date(1743648000 * SECOND + 24 * HOUR); // 24h after epoch was published.
        let error;
        try {
            await verifyCertChain(await parseCertChain(zeroSSLCertificateChain), KT_CERTIFICATE_ISSUER.ZEROSSL, now);
        } catch (err) {
            error = err;
        }
        expect(error).toBeUndefined();
    });
    it('Should verify LE certificate', async () => {
        const now = new Date(1743684323 * SECOND + 24 * HOUR); // 24h after epoch was published.
        let error;
        try {
            await verifyCertChain(
                await parseCertChain(letsEncryptCertificateChain),
                KT_CERTIFICATE_ISSUER.LETSENCRYPT,
                now
            );
        } catch (err) {
            error = err;
        }
        expect(error).toBeUndefined();
    });
    it('Should fail on expiry', async () => {
        const now = new Date(1709529634 * SECOND + 1 * YEAR); // 1year after epoch was published.
        let error;
        try {
            await verifyCertChain(
                await parseCertChain(letsEncryptCertificateChain),
                KT_CERTIFICATE_ISSUER.LETSENCRYPT,
                now
            );
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toEqual("Epoch certificate did not pass verification against issuer's certificate chain");
    });
    it('Should fail if the certificate is in the future', async () => {
        const now = new Date(1709529634 * SECOND - 1 * YEAR); // 1year before epoch was published.
        let error;
        try {
            await verifyCertChain(
                await parseCertChain(letsEncryptCertificateChain),
                KT_CERTIFICATE_ISSUER.LETSENCRYPT,
                now
            );
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toEqual("Epoch certificate did not pass verification against issuer's certificate chain");
    });
    it('Should fail if the certificate chain is broken', async () => {
        const now = new Date(1709529634 * SECOND + 24 * HOUR); // 24h after epoch was published.
        let error;
        try {
            const zeroSSLChain = await parseCertChain(zeroSSLCertificateChain);
            const letsEncryptChain = await parseCertChain(letsEncryptCertificateChain);
            const chain = [letsEncryptChain[0], ...zeroSSLChain.slice(1)];
            await verifyCertChain(chain, KT_CERTIFICATE_ISSUER.LETSENCRYPT, now);
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toEqual("Epoch certificate did not pass verification against issuer's certificate chain");
    });
});
