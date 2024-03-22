import {
    intoAuthenticatorAssertionResponse,
    intoAuthenticatorAttestationResponse,
    intoPublicKeyCredential,
} from '@proton/pass/lib/passkeys/webauthn';
import type { MessageFailure } from '@proton/pass/types';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { sanitizeBuffers } from '@proton/pass/utils/buffer/sanitization';
import { logger } from '@proton/pass/utils/logger';

import { createMessageBridge } from './bridge/message';
import { clone, exporter, promise } from './bridge/utils';

type CredentialsGet = typeof navigator.credentials.get;
type CredentialsCreate = typeof navigator.credentials.create;

(() => {
    /** In Firefox, DOM objects in content scripts receive an additional
     * property called `wrappedJSObject`. This property contains an "unwrapped"
     * version of the object, including any modifications made by page scripts.
     * This override is necessary to intercept and manipulate navigator APIs */
    const self = window.wrappedJSObject ?? window;
    const credentials = self.navigator.credentials;
    const webauthnSupported = typeof credentials?.get === 'function' && typeof credentials?.create === 'function';

    if (!webauthnSupported) return;

    const create = credentials.create.bind(navigator.credentials);
    const get = credentials.get.bind(navigator.credentials);
    const Exception = window.DOMException;

    const bridge = createMessageBridge();
    bridge.init();

    const handleBridgeError = ({ error }: MessageFailure): Error => {
        switch (error) {
            case 'BridgeAbort':
                return new Exception('The operation either timed out or was not allowed.', 'NotAllowedError');
            default:
                return new Exception(`Something went wrong: ${error}`, 'NotAllowedError');
        }
    };

    const createCredentials: CredentialsCreate = (options) =>
        promise<MaybeNull<Credential>>(async (resolve) => {
            if (!options?.publicKey) return resolve(create(options));

            const result = await bridge.sendMessage(
                {
                    type: WorkerMessageType.PASSKEY_CREATE,
                    payload: {
                        request: JSON.stringify(sanitizeBuffers(options.publicKey)),
                        domain: location.hostname,
                    },
                },
                { timeout: options.publicKey.timeout }
            );

            if (result.type === 'error') throw handleBridgeError(result);

            if (!result.intercept) {
                logger.debug('[WebAuthn] Intercept cancelled for `create`');
                return resolve(create(options));
            }

            const response = intoAuthenticatorAttestationResponse(result.response.credential);
            return resolve(clone(intoPublicKeyCredential(result.response.credential, response, clone)));
        });

    const getCredentials: CredentialsGet = (options) =>
        promise<MaybeNull<Credential>>(async (resolve, reject) => {
            if (!options?.publicKey) return resolve(get(options));

            const result = await bridge.sendMessage(
                {
                    type: WorkerMessageType.PASSKEY_GET,
                    payload: {
                        request: JSON.stringify(sanitizeBuffers(options.publicKey)),
                        domain: location.hostname,
                    },
                },
                { timeout: options.publicKey.timeout }
            );

            if (result.type === 'error') return reject(handleBridgeError(result));

            if (!result.intercept) {
                logger.debug('[WebAuthn] Intercept cancelled for `get`');
                return resolve(get(options));
            }

            const response = intoAuthenticatorAssertionResponse(result.response.credential);
            resolve(clone(intoPublicKeyCredential(result.response.credential, response, clone)));
        });

    exporter(getCredentials, credentials, { defineAs: 'get' });
    exporter(createCredentials, credentials, { defineAs: 'create' });
})();
