import * as asn1js from 'asn1js';
import { epoch } from './keyTransparency.data';
import { parseCertChain, parseCertificate, checkAltName, verifyLEcert, verifySCT } from '../lib/certTransparency';

describe('certificate transparency', () => {
    it('should verify a certificate', async () => {
        const { Certificate, ChainHash, EpochID } = epoch;

        const certChain = parseCertChain(Certificate);
        const epochCert = certChain[0];
        const issuerCert = certChain[1];
        await verifyLEcert(certChain);
        checkAltName(epochCert, ChainHash, EpochID);
        await verifySCT(epochCert, issuerCert);
    });

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

    it('should fail in checkAltName with missing extensions', () => {
        const { Certificate, ChainHash, EpochID } = epoch;
        const cert = parseCertificate(Certificate);
        const { extensions, ...certNoExt } = cert;

        let errorThrown = true;
        try {
            checkAltName(certNoExt, ChainHash, EpochID);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate does not have extensions');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in checkAltName with missing AltName extension', () => {
        const { Certificate, ChainHash, EpochID } = epoch;
        const cert = parseCertificate(Certificate);
        const corruptExt = cert.extensions.filter((ext) => ext.extnID !== '2.5.29.17');

        let errorThrown = true;
        try {
            checkAltName({ ...cert, extensions: corruptExt }, ChainHash, EpochID);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate does not have AltName extension');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in checkAltName with corrupt altName', () => {
        const { Certificate, ChainHash, EpochID } = epoch;
        const cert = parseCertificate(Certificate);
        cert.extensions.map((ext) => {
            if (ext.extnID === '2.5.29.17') {
                ext.parsedValue.altNames[0].value = 'corrupt';
            }
            return ext;
        });

        let errorThrown = true;
        try {
            checkAltName(cert, ChainHash, EpochID);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual('Epoch certificate alternative name does not match');
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail certificate verification', async () => {
        const { Certificate } = epoch;
        const certChain = parseCertChain(Certificate);
        certChain[0].tbs = new Uint8Array(10).buffer;

        let errorThrown = true;
        try {
            await verifyLEcert(certChain);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual(
                "Epoch certificate did not pass verification against issuer's certificate chain"
            );
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifySCT with missing extensions', async () => {
        const { Certificate } = epoch;
        const cert = parseCertificate(Certificate);
        const { extensions, ...certNoExt } = cert;

        let errorThrown = true;
        try {
            await verifySCT(certNoExt);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual(
                `SCT verification halted with error "Cannot read property 'length' of undefined"`
            );
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifySCT with missing SCTs extension', async () => {
        const { Certificate } = epoch;
        const cert = parseCertificate(Certificate);
        const corruptExt = cert.extensions.filter((ext) => ext.extnID !== '1.3.6.1.4.1.11129.2.4.2');

        let errorThrown = true;
        try {
            await verifySCT({ ...cert, extensions: corruptExt });
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual(
                `SCT verification halted with error "No SignedCertificateTimestampList extension in the specified certificate"`
            );
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifySCT with missing SCTs', async () => {
        const { Certificate } = epoch;
        const cert = parseCertificate(Certificate);
        cert.extensions.map((ext) => {
            if (ext.extnID === '1.3.6.1.4.1.11129.2.4.2') {
                ext.parsedValue.timestamps = [];
            }
            return ext;
        });

        let errorThrown = true;
        try {
            await verifySCT(cert);
            errorThrown = false;
        } catch (err) {
            expect(err.message).toEqual(`SCT verification halted with error "Nothing to verify in the certificate"`);
        }
        expect(errorThrown).toEqual(true);
    });

    it('should fail in verifySCT with corrupt certificate', async () => {
        const { Certificate } = epoch;
        const certChain = parseCertChain(Certificate);
        const epochCert = certChain[0];
        const issuerCert = certChain[1];
        epochCert.serialNumber = new asn1js.Integer();

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
