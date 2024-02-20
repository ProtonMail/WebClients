import { createHash, createPublicKey } from 'crypto';

enum VerificationResult {
    Accept = 0,
    Reject = -2,
}

const PROTON_CERT_PK_HASHES = [
    // proton.me certificate
    'CT56BhOTmj5ZIPgb/xD5mH8rY3BLo/MlhP7oPyJUEDo=', // Current
    '35Dx28/uzN3LeltkCBQ8RHK0tlNSa2kCpCRGNp34Gxc=', // Hot backup
    'qYIukVc63DEITct8sFT7ebIq5qsWmuscaIKeJx+5J5A=', // Cold backup
];

const isProtonTlsCertificate = (...[key]: Parameters<typeof createPublicKey>): boolean => {
    const pubKey = createPublicKey(key).export({ type: 'spki', format: 'der' });
    const pubKeyHash = createHash('sha256').update(pubKey).digest('base64');
    return PROTON_CERT_PK_HASHES.includes(pubKeyHash);
};

export const certificateVerifyProc = (request: Electron.Request, callback: (code: VerificationResult) => void) => {
    const {
        validatedCertificate: { data },
        verificationResult,
    } = request;

    if (verificationResult === 'net::OK' && isProtonTlsCertificate(data)) return callback(VerificationResult.Accept);
    return callback(VerificationResult.Reject);
};
