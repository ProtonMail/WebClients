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
type BridgeErrorOptions = { data: MessageFailure; onReject: (error: Error) => void; onFallback: () => void };

(() => {
    /** In Firefox, DOM objects in content scripts receive an additional
     * property called `wrappedJSObject`. This property contains an "unwrapped"
     * version of the object, including any modifications made by page scripts.
     * This override is necessary to intercept and manipulate navigator APIs */
    const self = (window.wrappedJSObject ?? window) as Window & typeof globalThis;
    const credentials = self.navigator.credentials;
    const pk = self.PublicKeyCredential;
    const webauthnSupported = typeof credentials?.get === 'function' && typeof credentials?.create === 'function';

    if (!webauthnSupported) return;

    const create = credentials.create.bind(navigator.credentials);
    const get = credentials.get.bind(navigator.credentials);
    const conditionalMediationAvailable = pk?.isConditionalMediationAvailable?.bind(pk);
    const verifyingPlatformAuthenticatorAvailable = pk?.isUserVerifyingPlatformAuthenticatorAvailable?.bind(pk);

    const Exception = window.DOMException;

    const bridge = createMessageBridge();
    bridge.init();

    const handleBridgeError = ({ data, onFallback, onReject }: BridgeErrorOptions): void => {
        switch (data.error) {
            case 'BridgeTimeout':
            case 'BridgeDisconnected':
                return onFallback();
            case 'BridgeAbort':
                return onReject(new Exception('The operation either timed out or was not allowed.', 'NotAllowedError'));
            default:
                return onReject(new Exception(`Something went wrong: ${data.payload}`, 'NotAllowedError'));
        }
    };

    const createCredentials: CredentialsCreate = (options) =>
        promise<MaybeNull<Credential>>(async (resolve, reject) => {
            if (!options?.publicKey || !bridge.getState().connected) return resolve(create(options));

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

            if (result.type === 'error') {
                return handleBridgeError({
                    data: result,
                    onReject: reject,
                    onFallback: () => resolve(create(options)),
                });
            }

            if (!result.intercept) {
                logger.debug('[WebAuthn] Intercept cancelled for `create`');
                return resolve(create(options));
            }

            const response = intoAuthenticatorAttestationResponse(result.response.credential);
            return resolve(clone(intoPublicKeyCredential(result.response.credential, response, clone)));
        });

    const getCredentials: CredentialsGet = (options) =>
        promise<MaybeNull<Credential>>(async (resolve, reject) => {
            if (!options?.publicKey || !bridge.getState().connected) return resolve(get(options));

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

            if (result.type === 'error') {
                return handleBridgeError({
                    data: result,
                    onReject: reject,
                    onFallback: () => resolve(get(options)),
                });
            }

            if (!result.intercept) {
                logger.debug('[WebAuthn] Intercept cancelled for `get`');
                return resolve(get(options));
            }

            const response = intoAuthenticatorAssertionResponse(result.response.credential);
            resolve(clone(intoPublicKeyCredential(result.response.credential, response, clone)));
        });

    const shouldIntercept = async (): Promise<boolean> =>
        bridge.getState().connected
            ? bridge
                  .sendMessage({ type: WorkerMessageType.PASSKEY_INTERCEPT }, {})
                  .then((res) => (res.type === 'success' ? res.intercept : false))
                  .catch(() => false)
            : false;

    const mediationAvailable = () =>
        promise<boolean>(async (resolve) => {
            const intercept = await shouldIntercept();
            resolve(Boolean(intercept || (await conditionalMediationAvailable?.())));
        });

    const authenticatorAvailable = () =>
        promise<boolean>(async (resolve) => {
            const intercept = await shouldIntercept();
            resolve(Boolean(intercept || (await verifyingPlatformAuthenticatorAvailable?.())));
        });

    exporter(getCredentials, credentials, { defineAs: 'get' });
    exporter(createCredentials, credentials, { defineAs: 'create' });

    if (pk) {
        exporter(mediationAvailable, pk, { defineAs: 'isConditionalMediationAvailable' });
        exporter(authenticatorAvailable, pk, { defineAs: 'isUserVerifyingPlatformAuthenticatorAvailable' });
    }
})();
