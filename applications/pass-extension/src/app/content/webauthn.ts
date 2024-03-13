import {
    intoAuthenticatorAssertionResponse,
    intoAuthenticatorAttestationResponse,
    intoPublicKeyCredential,
} from '@proton/pass/lib/passkeys/webauthn';
import { WorkerMessageType } from '@proton/pass/types';
import { sanitizeBuffers } from '@proton/pass/utils/buffer/sanitization';
import { logger } from '@proton/pass/utils/logger';

import { createMessageBridge } from './bridge/main';

const bridge = createMessageBridge();
bridge.init();

const create = navigator.credentials.create.bind(navigator.credentials);
const get = navigator.credentials.get.bind(navigator.credentials);

navigator.credentials.create = async (options) => {
    try {
        if (!options?.publicKey) throw new Error('Missing public key');
        const result = await bridge.sendMessage({
            type: WorkerMessageType.PASSKEY_CREATE,
            payload: {
                publicKey: sanitizeBuffers(options.publicKey),
                domain: location.hostname,
            },
        });

        if (result.type !== 'success' || !result.intercept) throw new Error();

        const response = intoAuthenticatorAttestationResponse(result.response.credential);
        return intoPublicKeyCredential(result.response.credential, response);
    } catch {
        logger.debug('[WebAuthn] Intercept canceled for `create`');
        return create(options);
    }
};

navigator.credentials.get = async (options) => {
    try {
        if (!options?.publicKey) throw new Error('Missing public key');
        const result = await bridge.sendMessage({
            type: WorkerMessageType.PASSKEY_GET,
            payload: {
                publicKey: sanitizeBuffers(options.publicKey),
                domain: location.hostname,
            },
        });

        if (result.type !== 'success' || !result.intercept) throw new Error();

        const response = intoAuthenticatorAssertionResponse(result.response.credential);
        return intoPublicKeyCredential(result.response.credential, response);
    } catch {
        logger.debug('[WebAuthn] Intercept canceled for `get`');
        return get(options);
    }
};
