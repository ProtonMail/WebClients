import { Integer as asn1jsInteger } from 'asn1js';

import {
    parseCertChain,
    parseCertificate,
    verifyAltName,
    verifyCertChain,
    verifySCT,
} from '../lib/verification/verifyCertificates';
import { epoch } from './verifyKeys.data';

describe('certificate transparency', () => {
    it('should fail to parse with corrupt certificate', () => {
        let errorThrown = true;
        try {
            parseCertificate('corrupt');
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual("Object's schema was not verified against input data for Certificate");
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifyAltName with missing extensions', () => {
        const { Certificate, ChainHash, EpochID, CertificateTime } = epoch;
        const [cert] = parseCertChain(Certificate);
        const { extensions, ...certNoExt } = cert;

        let errorThrown = true;
        try {
            verifyAltName(certNoExt, ChainHash, EpochID, CertificateTime);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate does not have extensions');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifyAltName with missing AltName extension', () => {
        const { Certificate, ChainHash, EpochID, CertificateTime } = epoch;
        const [cert] = parseCertChain(Certificate);
        const corruptExt = cert.extensions.filter((ext) => ext.extnID !== '2.5.29.17');

        let errorThrown = true;
        try {
            verifyAltName({ ...cert, extensions: corruptExt }, ChainHash, EpochID, CertificateTime);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate does not have AltName extension');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail certificate verification', async () => {
        const { Certificate, CertificateIssuer } = epoch;
        const certChain = parseCertChain(Certificate);
        certChain[0].tbsView = new Uint8Array(10);

        let errorThrown = true;
        try {
            await verifyCertChain(certChain, CertificateIssuer);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual(
                "Epoch certificate did not pass verification against issuer's certificate chain"
            );
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifySCT with corrupt certificate', async () => {
        const { Certificate } = epoch;
        const certChain = parseCertChain(Certificate);
        const epochCert = certChain[0];
        const issuerCert = certChain[1];
        epochCert.serialNumber = new asn1jsInteger();

        let errorThrown = true;
        try {
            await verifySCT(epochCert, issuerCert);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('The number of verified SCTs does not reach the number of operator threshold');
        }
        expect(errorThrown).toEqual(true);
    });
});
