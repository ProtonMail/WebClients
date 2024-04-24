import { CryptoProxy } from '@proton/crypto';

import { VerificationData } from '../interface';
import { Verifier } from './interface';

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
