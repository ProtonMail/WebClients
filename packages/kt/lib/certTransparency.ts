import * as asn1js from 'asn1js';
import Certificate from 'pkijs/src/Certificate';
import { verifySCTsForCertificate } from 'pkijs/src/SignedCertificateTimestampList';
import GeneralName from 'pkijs/src/GeneralName';
import { getParametersValue } from 'pvutils';
import { base64StringToUint8Array } from './helpers/encoding';
import { ctLogs, rootCertificates } from './certificates';

function pemToBinary(pem: string) {
    const lines = pem.split('\n');
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
    return base64StringToUint8Array(encoded).buffer;
}

export function parseCertificate(cert: string) {
    const asn1Certificate = asn1js.fromBER(pemToBinary(cert));
    return new Certificate({ schema: asn1Certificate.result });
}

export function parseCertChain(certChain: string) {
    let certArr = certChain.split('-----END CERTIFICATE-----\n\n-----BEGIN CERTIFICATE-----');
    // Temporary change for legacy epochs
    if (certArr.length === 1) {
        certArr = certChain.split('-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----');
    }
    // END
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
    const result = [];
    for (let i = 0; i < certArr.length; i++) {
        try {
            result.push(parseCertificate(certArr[i]));
        } catch (err) {
            throw new Error(`Certificate[${i}] parsing failed with error: ${err.message}`);
        }
    }
    return result;
}

export function checkAltName(certificate: Certificate, ChainHash: string, EpochID: number) {
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
    if (`${ChainHash.slice(0, 32)}.${ChainHash.slice(32)}.${EpochID}.0.${domain.slice(6, domain.length)}` !== altName) {
        throw new Error('Epoch certificate alternative name does not match');
    }
}

async function verifyTopCert(topCert: Certificate) {
    let parentCAcert: Certificate;
    try {
        const parentName = topCert.issuer.typesAndValues.filter(
            (issuerName) => issuerName.type.toString() === '2.5.4.3'
        )[0];
        const parentCN = getParametersValue<{ valueBlock: { value: string } }>(parentName, 'value')
            .valueBlock.value.split(' ')
            .join('');
        if (!Object.keys(rootCertificates).includes(parentCN)) {
            return false;
        }
        parentCAcert = parseCertificate(rootCertificates[parentCN]);
    } catch (err) {
        return false;
    }
    return topCert.verify(parentCAcert);
}

export async function verifyLEcert(certChain: Certificate[]) {
    let verificationCert = certChain[certChain.length - 1];
    if (!(await verifyTopCert(verificationCert))) {
        throw new Error('Epoch certificate did not pass verification of top certificate');
    }
    let verified = true;
    for (let i = certChain.length - 2; i >= 0; i--) {
        verified = verified && (await certChain[i].verify(verificationCert));
        verificationCert = certChain[i];
    }
    if (!verified) {
        throw new Error("Epoch certificate did not pass verification against issuer's certificate chain");
    }
}

export async function verifySCT(certificate: Certificate, issuerCert: Certificate) {
    // issuerCert is the certificate that signed the epoch certificate. At this point we
    // assume that issuerCert was already verified in the certificate chain.
    let verificationResult: boolean[];
    try {
        verificationResult = await verifySCTsForCertificate(certificate, issuerCert, ctLogs);
    } catch (err) {
        throw new Error(`SCT verification halted with error "${err.message}"`);
    }
    const verified = verificationResult.reduce((previous, current) => {
        return previous && current;
    });
    if (!verified) {
        throw new Error('SCT verification failed');
    }
}
