import { createHash, createPublicKey } from 'crypto';

import logger from './utils/logger';

enum VerificationResult {
    Accept = 0,
    Reject = -2,
}

const KNOWN_DOMAIN_HASHES: Record<string, string[]> = {
    'proton.me': [
        'CT56BhOTmj5ZIPgb/xD5mH8rY3BLo/MlhP7oPyJUEDo=', // Current
        '35Dx28/uzN3LeltkCBQ8RHK0tlNSa2kCpCRGNp34Gxc=', // Hot backup
        'qYIukVc63DEITct8sFT7ebIq5qsWmuscaIKeJx+5J5A=', // Cold backup
    ],
};

const isMatchingTlsCertificate = (key: Parameters<typeof createPublicKey>[0], knownHashes: string[]): boolean => {
    const pubKey = createPublicKey(key).export({ type: 'spki', format: 'der' });
    const pubKeyHash = createHash('sha256').update(pubKey).digest('base64');
    return knownHashes.includes(pubKeyHash);
};

export const certificateVerifyProc = (request: Electron.Request, callback: (code: VerificationResult) => void) => {
    // Immediately reject untrusted certificates
    const isTrusted = request.verificationResult === 'net::OK';
    if (!isTrusted) {
        logger.warn(`[tls] cerificate for ${request.hostname} is not trusted, result = ${request.verificationResult}`);
        return callback(VerificationResult.Reject);
    }

    // We're only verifying certificate hashes for domains we keep
    // the hashes for _including ALL their subdomains_.
    // Other requests like ones to SSO providers we can safely skip,
    // as long as they're otherwise trusted by `isTrusted` above
    const hashDomain =
        request.hostname in KNOWN_DOMAIN_HASHES
            ? request.hostname
            : Object.keys(KNOWN_DOMAIN_HASHES).find((d) => request.hostname.endsWith(`.${d}`));
    if (!hashDomain) {
        logger.debug(`[tls] skipping pinning for unknown hostname ${request.hostname}`);
        return callback(VerificationResult.Accept);
    }

    // Reject certificates that don't match the known hashes
    const {
        validatedCertificate: { data },
    } = request;
    const isMatching = isMatchingTlsCertificate(data, KNOWN_DOMAIN_HASHES[hashDomain]);
    if (!isMatching) {
        logger.warn(`[tls] invalid certificate hash for ${request.hostname} (via ${hashDomain})`, data);
        return callback(VerificationResult.Reject);
    }

    return callback(VerificationResult.Accept);
};
