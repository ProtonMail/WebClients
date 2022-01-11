import { fromBER } from 'asn1js';
import Certificate from 'pkijs/src/Certificate';
import { verifySCTsForCertificate } from 'pkijs/src/SignedCertificateTimestampList';
import GeneralName from 'pkijs/src/GeneralName';
import { getParametersValue } from 'pvutils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { ctLogs, rootCertificates } from './certificates';

/**
 * Extract the content of a string Certificate
 */
export const pemToString = (cert: string) => {
    const lines = cert.split('\n');
    let encoded = '';

    for (let i = 0; i < lines.length; i++) {
        if (
            lines[i].trim().length > 0 &&
            lines[i].indexOf('-BEGIN CERTIFICATE-') < 0 &&
            lines[i].indexOf('-END CERTIFICATE-') < 0
        ) {
            encoded += lines[i].trim();
        }
    }

    return encoded;
};

/**
 * Parse a string certificate into a Certificate object
 */
export const parseCertificate = (cert: string) => {
    const asn1Certificate = fromBER(base64StringToUint8Array(pemToString(cert)).buffer);
    return new Certificate({ schema: asn1Certificate.result });
};

/**
 * Parse a chain of certificates into an array of Certificate objects
 */
export const parseCertChain = (certChain: string) => {
    const certArr = certChain.split('-----END CERTIFICATE-----\n\n-----BEGIN CERTIFICATE-----');

    for (let i = 0; i < certArr.length; i++) {
        switch (i) {
            case 0:
                certArr[i] = `${certArr[i]}-----END CERTIFICATE-----`;
                break;
            case certArr.length - 1:
                certArr[i] = `-----BEGIN CERTIFICATE-----${certArr[i]}`;
                break;
            default:
                certArr[i] = `-----BEGIN CERTIFICATE-----${certArr[i]}-----END CERTIFICATE-----`;
                break;
        }
    }

    const result: Certificate[] = [];
    for (let i = 0; i < certArr.length; i++) {
        try {
            result.push(parseCertificate(certArr[i]));
        } catch (error: any) {
            throw new Error(`Certificate[${i}] parsing failed with error: ${error.message}`);
        }
    }

    return result;
};

/**
 * Check the alternative name inside matches that provided by KT
 */
export const checkAltName = (certificate: Certificate, ChainHash: string) => {
    if (!certificate.extensions) {
        throw new Error('Epoch certificate does not have extensions');
    }

    const altNamesExt = certificate.extensions.find((ext) => ext.extnID === '2.5.29.17');
    if (!altNamesExt) {
        throw new Error('Epoch certificate does not have AltName extension');
    }

    altNamesExt.parsedValue.altNames.sort((firstEl: GeneralName, secondEl: GeneralName) => {
        const firstLenght = getParametersValue<string>(firstEl, 'value').length;
        const secondLenght = getParametersValue<string>(secondEl, 'value').length;
        return secondLenght - firstLenght;
    });

    const altName = altNamesExt.parsedValue.altNames[0].value;
    const domain = altNamesExt.parsedValue.altNames[1].value;

    if (`${ChainHash.slice(0, 32)}.${ChainHash.slice(32)}.${domain.slice(6, domain.length)}` !== altName) {
        throw new Error('Epoch certificate alternative name does not match');
    }
};

/**
 * Verify the first certificate in a chain with one of the hardcoded root certificates
 */
export const verifyTopCert = (topCert: Certificate) => {
    const topCertString = uint8ArrayToBase64String(new Uint8Array((topCert.toSchema() as any).toBER()));

    for (const rootCert of Object.keys(rootCertificates)) {
        if (topCertString === pemToString(rootCertificates[rootCert])) {
            return true;
        }
    }

    return false;
};

/**
 * Verify a full certificate chain
 */
export const verifyLEcert = async (certChain: Certificate[]) => {
    let verificationCert = certChain[certChain.length - 1];
    if (!(await verifyTopCert(verificationCert))) {
        throw new Error('Epoch certificate did not pass verification of top certificate');
    }

    let verified = true;
    for (let i = certChain.length - 2; i >= 0; i--) {
        // @ts-expect-error pkijs has a lack of typings
        verified = verified && (await certChain[i].verify(verificationCert));
        verificationCert = certChain[i];
    }

    if (!verified) {
        throw new Error("Epoch certificate did not pass verification against issuer's certificate chain");
    }
};

/**
 * Verify the SignedCertificateTimestamp of a given certificate with a given parent certificate
 */
export const verifySCT = async (certificate: Certificate, issuerCert: Certificate) => {
    // issuerCert is the certificate that signed the epoch certificate. At this point we
    // assume that issuerCert was already verified in the certificate chain.
    let verificationResult: boolean[];
    try {
        verificationResult = await verifySCTsForCertificate(certificate, issuerCert, ctLogs);
    } catch (error: any) {
        throw new Error(`SCT verification halted with error "${error.message}"`);
    }

    const verified = verificationResult.reduce((previous, current) => {
        return previous && current;
    });

    if (!verified) {
        throw new Error('SCT verification failed');
    }
};
