import {
    intoAuthenticatorAssertionResponse,
    intoAuthenticatorAttestationResponse,
    intoPublicKeyCredential,
} from '@proton/pass/lib/passkeys/webauthn';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { sanitizeBuffers } from '@proton/pass/utils/buffer/sanitization';
import { logger } from '@proton/pass/utils/logger';

import { createMessageBridge } from './bridge/message';
import { clone, exporter, promise } from './bridge/utils';

type CredentialsGet = typeof navigator.credentials.get;
type CredentialsCreate = typeof navigator.credentials.create;

/** In Firefox, DOM objects in content scripts receive an additional
 * property called `wrappedJSObject`. This property contains an "unwrapped"
 * version of the object, including any modifications made by page scripts.
 * This override is necessary to intercept and manipulate navigator APIs */
const self = window.wrappedJSObject ?? window;
const credentials = self.navigator.credentials;

const create = credentials.create.bind(navigator.credentials);
const get = credentials.get.bind(navigator.credentials);

(() => {
    const bridge = createMessageBridge();
    bridge.init();

    const createCredentials: CredentialsCreate = (options) =>
        promise<MaybeNull<Credential>>(async (resolve) => {
            try {
                if (!options?.publicKey) throw new Error('Missing public key');
                const result = await bridge.sendMessage({
                    type: WorkerMessageType.PASSKEY_CREATE,
                    payload: {
                        request: JSON.stringify(sanitizeBuffers(options.publicKey)),
                        domain: location.hostname,
                    },
                });

                if (result.type !== 'success' || !result.intercept) throw new Error();

                const response = intoAuthenticatorAttestationResponse(result.response.credential);
                return resolve(clone(intoPublicKeyCredential(result.response.credential, response, clone)));
            } catch (err) {
                logger.debug('[WebAuthn] Intercept canceled for `create`', err);
                return resolve(create(options));
            }
        });

    const getCredentials: CredentialsGet = (options) =>
        promise<MaybeNull<Credential>>(async (resolve) => {
            try {
                if (!options?.publicKey) throw new Error('Missing public key');

                const result = await bridge.sendMessage({
                    type: WorkerMessageType.PASSKEY_GET,
                    payload: {
                        request: JSON.stringify(sanitizeBuffers(options.publicKey)),
                        domain: location.hostname,
                    },
                });

                if (result.type !== 'success' || !result.intercept) throw new Error();

                const response = intoAuthenticatorAssertionResponse(result.response.credential);
                resolve(clone(intoPublicKeyCredential(result.response.credential, response, clone)));
            } catch (err) {
                logger.debug('[WebAuthn] Intercept canceled for `get`', err);
                return resolve(get(options));
            }
        });

    exporter(getCredentials, credentials, { defineAs: 'get' });
    exporter(createCredentials, credentials, { defineAs: 'create' });
})();
