import type { PasskeyCreateResponse, PasskeyGetResponse } from '@proton/pass/lib/passkeys/types';

import * as bridge from './bridge/message';

const create = jest.fn();
const get = jest.fn();
const credentials = { create, get };
class PublicKeyCredential {}
class AuthenticatorAttestationResponse {}
class AuthenticatorAssertionResponse {}

const mockBridge = {
    init: jest.fn(),
    sendMessage: jest.fn(),
    getState: jest.fn(() => ({ connected: true, ready: Promise.resolve() })),
};

describe('webauthn [supported]', () => {
    let createMessageBridge: jest.SpyInstance;

    beforeEach(async () => {
        createMessageBridge = jest.spyOn(bridge, 'createMessageBridge').mockImplementation(() => mockBridge as any);
        Object.defineProperty(window.navigator, 'credentials', { value: credentials });
        Object.defineProperty(global, 'PublicKeyCredential', { value: PublicKeyCredential });
        Object.defineProperty(global, 'AuthenticatorAttestationResponse', { value: AuthenticatorAttestationResponse });
        Object.defineProperty(global, 'AuthenticatorAssertionResponse', { value: AuthenticatorAssertionResponse });
        await import('./webauthn');
    });

    afterEach(() => {
        get.mockClear();
        create.mockClear();
        mockBridge.init.mockClear();
        mockBridge.sendMessage.mockClear();
        mockBridge.getState.mockClear();
    });

    test('should override credentials API', () => {
        expect(createMessageBridge).toHaveBeenCalledTimes(1);
        expect(navigator.credentials.get).not.toEqual(get);
        expect(navigator.credentials.create).not.toEqual(create);
    });

    describe('credentials.create', () => {
        test('should fallback to original API if no publicKey in options', async () => {
            await navigator.credentials.create({});
            expect(create).toHaveBeenCalledTimes(1);
            expect(mockBridge.sendMessage).not.toHaveBeenCalled();
        });

        test('should fallback to original API if bridge is disconnected', async () => {
            mockBridge.getState.mockReturnValue({ connected: false, ready: Promise.resolve() });
            await navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(create).toHaveBeenCalledTimes(1);
            expect(mockBridge.sendMessage).not.toHaveBeenCalled();
        });

        test('should fallback to original API if intercept is false', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ intercept: false }));

            await navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(create).toHaveBeenCalledTimes(1);
        });

        test('should fallback to original API on bridge disconnected error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'BridgeDisconnected' }));

            await navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(create).toHaveBeenCalledTimes(1);
        });

        test('should fallback to original API on bridge timeout error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'BridgeTimeout' }));

            await navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(create).toHaveBeenCalledTimes(1);
        });

        test('should throw on bridge abort error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'BridgeAbort' }));

            const request = navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            await expect(request).rejects.toBeInstanceOf(DOMException);
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(create).not.toHaveBeenCalled();
        });

        test('should throw on bridge on unknown error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'TypeError' }));

            const request = navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            await expect(request).rejects.toBeInstanceOf(DOMException);
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(create).not.toHaveBeenCalled();
        });

        test('should correctly create PublicKeyCredential', async () => {
            const mockResponse: PasskeyCreateResponse = {
                intercept: true,
                response: {
                    credential: {
                        id: 'credential-id',
                        raw_id: [],
                        authenticator_attachment: 'cross-platform',
                        client_extension_results: { credProps: undefined },
                        type: 'public-key',
                        response: {
                            client_data_json: [],
                            authenticator_data: [],
                            public_key: [],
                            public_key_algorithm: -7,
                            attestation_object: [],
                            transports: undefined,
                        },
                    },
                    passkey: [],
                    key_id: 'key-id',
                    domain: 'proton.me',
                    rp_id: 'test-id',
                    rp_name: 'test',
                    user_name: 'test@proton.me',
                    user_display_name: 'john@proton.me',
                    user_id: [],
                    credential_id: [],
                    user_handle: [],
                    client_data_hash: [],
                    attestation_object: [],
                },
            };

            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve(mockResponse));

            const result = await navigator.credentials.create({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(PublicKeyCredential);
            expect((result as any).response).toBeInstanceOf(AuthenticatorAttestationResponse);
        });
    });

    describe('credentials.get', () => {
        test('should fallback to original API if no publicKey in options', async () => {
            await navigator.credentials.get({});
            expect(get).toHaveBeenCalledTimes(1);
            expect(mockBridge.sendMessage).not.toHaveBeenCalled();
        });

        test('should fallback to original API if bridge is disconnected', async () => {
            mockBridge.getState.mockReturnValue({ connected: false, ready: Promise.resolve() });
            await navigator.credentials.get({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(get).toHaveBeenCalledTimes(1);
            expect(mockBridge.sendMessage).not.toHaveBeenCalled();
        });

        test('should fallback to original API if intercept is false', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ intercept: false }));

            await navigator.credentials.get({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledTimes(1);
        });

        test('should fallback to original API on bridge disconnected error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'BridgeDisconnected' }));

            await navigator.credentials.get({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledTimes(1);
        });

        test('should fallback to original API on bridge timeout error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'BridgeTimeout' }));

            await navigator.credentials.get({ publicKey: {} as PublicKeyCredentialCreationOptions });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledTimes(1);
        });

        test('should throw on bridge abort error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'BridgeAbort' }));

            const request = navigator.credentials.get({ publicKey: {} as PublicKeyCredentialCreationOptions });
            await expect(request).rejects.toBeInstanceOf(DOMException);
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(get).not.toHaveBeenCalled();
        });

        test('should throw on bridge on unknown error', async () => {
            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve({ type: 'error', error: 'TypeError' }));

            const request = navigator.credentials.get({ publicKey: {} as PublicKeyCredentialCreationOptions });
            await expect(request).rejects.toBeInstanceOf(DOMException);
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(get).not.toHaveBeenCalled();
        });

        test('should correctly create PublicKeyCredential', async () => {
            const mockResponse: PasskeyGetResponse = {
                intercept: true,
                response: {
                    credential: {
                        id: 'credential-id',
                        raw_id: [],
                        authenticator_attachment: 'cross-platform',
                        client_extension_results: { credProps: undefined },
                        type: 'public-key',
                        response: {
                            client_data_json: [],
                            authenticator_data: [],
                            signature: [],
                            user_handle: [],
                            attestation_object: [],
                        },
                    },
                },
            };

            mockBridge.getState.mockReturnValue({ connected: true, ready: Promise.resolve() });
            mockBridge.sendMessage.mockReturnValue(Promise.resolve(mockResponse));

            const result = await navigator.credentials.get({
                publicKey: {} as PublicKeyCredentialCreationOptions,
            });
            expect(mockBridge.sendMessage).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(PublicKeyCredential);
            expect((result as any).response).toBeInstanceOf(AuthenticatorAssertionResponse);
        });
    });
});
