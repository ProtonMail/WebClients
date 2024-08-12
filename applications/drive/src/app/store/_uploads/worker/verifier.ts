import type { ScopeContext } from '@sentry/types';

import { CryptoProxy } from '@proton/crypto';

import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import type { VerificationData } from '../interface';
import type { Verifier } from './interface';

const VERIFIER_ERROR_MESSAGE = 'Upload failed: Verification of data failed';

export const isVerificationError = (err: any) => {
    const message = err ? err.message || '' : '';
    return message.includes(VERIFIER_ERROR_MESSAGE);
};

export class VerificationError extends EnrichedError {
    constructor(context?: Partial<ScopeContext>) {
        super(VERIFIER_ERROR_MESSAGE, context);

        // It is important that the name is "Error", as we want it
        // to be compatible with existing handlers, and mitigate
        // the chances of the actual name showing in the UI
        this.name = 'Error';
    }
}

export const createVerifier = ({ verificationCode, verifierSessionKey }: VerificationData): Verifier => {
    return async (encryptedData: Uint8Array) => {
        // Attempt to decrypt data block, to try to detect bitflips / bad hardware
        //
        // We don't check the signature as it is an expensive operation,
        // and we don't need to here as we always have the manifest signature
        //
        // Additionally, we use the key provided by the verification endpoint, to
        // ensure the correct key was used to encrypt the data
        await CryptoProxy.decryptMessage({
            binaryMessage: encryptedData,
            sessionKeys: verifierSessionKey,
        });

        // The verifier requires a 0-padded data packet, so we can
        // access the array directly and fall back to 0.
        return verificationCode.map((value, index) => value ^ (encryptedData[index] || 0));
    };
};
