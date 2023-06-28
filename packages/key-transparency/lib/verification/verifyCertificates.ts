import { fromBER } from 'asn1js';
import { Certificate, GeneralName, verifySCTsForCertificate } from 'pkijs';
import { getParametersValue } from 'pvutils';

import { serverTime } from '@proton/crypto';
import { hexStringToArray } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { KT_CERTIFICATE_ISSUER, SCT_THRESHOLD, epochChainVersion } from '../constants';
import { ctLogs, rootCertificates } from '../constants/certificates';
import { getBaseDomain, throwKTError } from '../helpers/utils';

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

    return certArr.map((cert) => parseCertificate(cert));
};

/**
 * Check the alternative name inside a certificate matches the one given by the server
 */
export const verifyAltName = (
    certificate: Certificate,
    ChainHash: string,
    EpochID: number,
    CertificateTime: number
) => {
    if (!certificate.extensions) {
        return throwKTError('Epoch certificate does not have extensions', {
            extensions: JSON.stringify(certificate.extensions),
        });
    }

    const altNamesExt = certificate.extensions.find((ext) => ext.extnID === '2.5.29.17');
    if (!altNamesExt) {
        return throwKTError('Epoch certificate does not have AltName extension', {
            altNamesExt: JSON.stringify(altNamesExt),
        });
    }

    altNamesExt.parsedValue.altNames.sort((firstEl: GeneralName, secondEl: GeneralName) => {
        const firstLenght = getParametersValue<string>(firstEl, 'value', '').length;
        const secondLenght = getParametersValue<string>(secondEl, 'value', '').length;
        return secondLenght - firstLenght;
    });

    // The primary name cannot be longer than 64 chars due to TLS certificate restrictions, which
    // means that it will be the shorter of the two. The alternative name is the one containing ChainHash
    // and is therefore the longest of the two
    const alternativeName = altNamesExt.parsedValue.altNames[0].value;
    const baseDomain = getBaseDomain();

    if (
        `${ChainHash.slice(0, 32)}.${ChainHash.slice(
            32
        )}.${CertificateTime}.${EpochID}.${epochChainVersion}.${baseDomain}` !== alternativeName
    ) {
        return throwKTError('Epoch certificate alternative name does not match', {
            ChainHash,
            EpochID,
            alternativeName,
            baseDomain,
            CertificateTime,
        });
    }
};

/**
 * Convert a certificate back to string
 */
const printCertificate = (cert: Certificate) => {
    const body = uint8ArrayToBase64String(new Uint8Array(cert.toSchema().toBER()));
    let result = `-----BEGIN CERTIFICATE-----`;
    let i = 0;
    while (i < body.length) {
        result = `${result}\n${body.slice(i, i + 64)}`;
        i += 64;
    }
    result = `${result}\n-----END CERTIFICATE-----`;
    return result;
};

/**
 * Verify the first certificate in a chain with one of the hardcoded root certificates
 */
export const verifyTopCert = async (topCert: Certificate, CertificateIssuer: KT_CERTIFICATE_ISSUER) => {
    const rootCerts = rootCertificates.get(CertificateIssuer);
    if (rootCerts) {
        for (const rootCertName in rootCerts) {
            const rootCert = parseCertificate(rootCerts[rootCertName]);

            // For LE, the top certificate is one of the root certs
            if (rootCert.serialNumber.isEqual(topCert.serialNumber)) {
                return;
            }

            // For 0SSL, the top certificate is verified by one of the root certs
            const verified = await topCert.verify(rootCert);
            if (verified) {
                return;
            }
        }
    }

    return throwKTError('Epoch certificate did not pass verification of top certificate', {
        topCertString: printCertificate(topCert),
        CertificateIssuer,
    });
};

/**
 * Verify the expiration time of a certificate
 */
const verifyCertExpiry = (cert: Certificate) => {
    const now = +serverTime();
    if (+cert.notAfter.value < now) {
        return throwKTError('Certificate is expired', {
            stringCert: printCertificate(cert),
        });
    }
};

/**
 * Verify a full certificate chain
 */
export const verifyCertChain = async (certChain: Certificate[], CertificateIssuer: KT_CERTIFICATE_ISSUER) => {
    let verificationCert = certChain[certChain.length - 1];
    await verifyTopCert(verificationCert, CertificateIssuer);
    verifyCertExpiry(verificationCert);

    let verified = true;
    for (let i = certChain.length - 2; i >= 0; i--) {
        verified = verified && (await certChain[i].verify(verificationCert));
        verificationCert = certChain[i];
        verifyCertExpiry(verificationCert);
    }

    if (!verified) {
        return throwKTError("Epoch certificate did not pass verification against issuer's certificate chain", {
            certChain: JSON.stringify(certChain.map((cert) => printCertificate(cert))),
        });
    }
};

/**
 * Extract the list of CT log IDs from the SCTs of the certificate, in the order they appear
 */
export const extractSCTs = (certificate: Certificate) => {
    const SignedCertificateTimestampListID = '1.3.6.1.4.1.11129.2.4.2';
    const timestamps: string[] = [];

    for (let i = 0; certificate.extensions && i < certificate.extensions.length; i++) {
        if (certificate.extensions[i].extnID === SignedCertificateTimestampListID) {
            const { parsedValue } = certificate.extensions[i];
            if (parsedValue) {
                timestamps.push(
                    ...parsedValue
                        .toJSON()
                        .timestamps.map(({ logID }: { logID: string }) =>
                            uint8ArrayToBase64String(hexStringToArray(logID))
                        )
                );
            }
            break;
        }
    }

    return timestamps;
};

/**
 * Verify the SignedCertificateTimestamp of the given certificate. issuerCert is the certificate
 * of the issuer, which we assume was already verified as part of the certificate chain verification
 */
export const verifySCT = async (certificate: Certificate, issuerCert: Certificate) => {
    const scts = extractSCTs(certificate);

    const logs = ctLogs.operators.map(({ logs }) => logs.map(({ log_id, key }) => ({ log_id, key }))).flat();
    const verified: boolean[] = [];
    try {
        verified.push(...(await verifySCTsForCertificate(certificate, issuerCert, logs)));
    } catch (error: any) {
        return throwKTError('SCT verification failed', {
            errorMessage: error.message,
            certificate: printCertificate(certificate),
            issuerCert: printCertificate(issuerCert),
        });
    }

    if (verified.length !== scts.length) {
        return throwKTError('The number of verified SCTs does not match with the number of SCTs', {
            scts: JSON.stringify(scts),
            verified: JSON.stringify(verified),
            certificate: printCertificate(certificate),
            issuerCert: printCertificate(issuerCert),
        });
    }

    const sctsFromOperators = new Map<string, number>();
    for (let i = 0; i < scts.length; i++) {
        const isVerified = verified[i];
        const logID = scts[i];
        if (isVerified) {
            for (const operator of ctLogs.operators) {
                if (operator.logs.findIndex(({ log_id }) => log_id === logID) !== -1) {
                    const operatorName = operator.name;
                    const previousCount = sctsFromOperators.get(operatorName) || 0;
                    sctsFromOperators.set(operatorName, previousCount + 1);
                    break;
                }
            }
        }
    }

    if (sctsFromOperators.size < SCT_THRESHOLD) {
        return throwKTError('The number of verified SCTs does not reach the number of operator threshold', {
            scts: JSON.stringify(scts),
            verified: JSON.stringify(verified),
            certificate: printCertificate(certificate),
            issuerCert: printCertificate(issuerCert),
            sctsFromOperators: JSON.stringify([...sctsFromOperators.entries()]),
        });
    }
};

export const parseCertTime = (cert: Certificate) => {
    let returnedDate: number;
    switch (cert.notBefore.type) {
        case 0:
        case 1:
            returnedDate = cert.notBefore.value.getTime();
            break;
        default:
            return throwKTError("Certificate's notBefore date is invalid", {
                certType: cert.notBefore.type,
            });
    }
    return returnedDate;
};
