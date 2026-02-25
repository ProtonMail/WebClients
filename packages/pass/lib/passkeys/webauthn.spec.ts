import type {
    WasmPublicKeyCredentialAssertion,
    WasmPublicKeyCredentialAttestation,
} from '@protontech/pass-rust-core/worker';

import {
    intoAuthenticatorAssertionResponse,
    intoAuthenticatorAttestationResponse,
    intoPublicKeyCredential,
} from './webauthn';

global.PublicKeyCredential = function PublicKeyCredential() {} as any;
global.AuthenticatorAttestationResponse = function AuthenticatorAttestationResponse() {} as any;
global.AuthenticatorAssertionResponse = function AuthenticatorAssertionResponse() {} as any;

const identity = <T>(obj: T): T => obj;

const mockAttestation: WasmPublicKeyCredentialAttestation = {
    authenticator_attachment: 'platform',
    id: 'credential-id',
    raw_id: [1, 2, 3],
    type: 'public-key',
    client_extension_results: { credProps: { rk: true }, prf: undefined },
    response: {
        attestation_object: [10, 20, 30],
        client_data_json: [40, 50, 60],
        authenticator_data: [70, 80, 90],
        public_key: [100, 110, 120],
        public_key_algorithm: -7,
        transports: ['internal'],
    },
};

const mockAssertion: WasmPublicKeyCredentialAssertion = {
    authenticator_attachment: 'platform',
    id: 'assertion-id',
    raw_id: [4, 5, 6],
    type: 'public-key',
    client_extension_results: {
        credProps: undefined,
        prf: { enabled: true, results: { first: [7, 8, 9], second: [10, 11, 12] } },
    },
    response: {
        client_data_json: [1, 2, 3],
        authenticator_data: [4, 5, 6],
        signature: [7, 8, 9],
        user_handle: [10, 11, 12],
        attestation_object: undefined,
    },
};

describe('intoAuthenticatorAttestationResponse', () => {
    test('instanceof `AuthenticatorAttestationResponse`', () => {
        expect(intoAuthenticatorAttestationResponse(mockAttestation)).toBeInstanceOf(AuthenticatorAttestationResponse);
    });

    test('maps buffers and methods', () => {
        const res = intoAuthenticatorAttestationResponse(mockAttestation);
        expect(res.attestationObject).toEqual(new Uint8Array(mockAttestation.response.attestation_object).buffer);
        expect(res.clientDataJSON).toEqual(new Uint8Array(mockAttestation.response.client_data_json).buffer);
        expect(res.getAuthenticatorData()).toEqual(new Uint8Array(mockAttestation.response.authenticator_data).buffer);
        expect(res.getPublicKey()).toEqual(new Uint8Array(mockAttestation.response.public_key!).buffer);
        expect(res.getPublicKeyAlgorithm()).toBe(-7);
        expect(res.getTransports()).toEqual(['internal']);
    });

    test('getPublicKey() returns `null` when absent', () => {
        const res = intoAuthenticatorAttestationResponse({
            ...mockAttestation,
            response: { ...mockAttestation.response, public_key: undefined },
        });
        expect(res.getPublicKey()).toBeNull();
    });

    test('getTransports() returns `[]` when absent', () => {
        const res = intoAuthenticatorAttestationResponse({
            ...mockAttestation,
            response: { ...mockAttestation.response, transports: undefined },
        });
        expect(res.getTransports()).toEqual([]);
    });
});

describe('intoAuthenticatorAssertionResponse', () => {
    test('instanceof `AuthenticatorAssertionResponse`', () => {
        expect(intoAuthenticatorAssertionResponse(mockAssertion)).toBeInstanceOf(AuthenticatorAssertionResponse);
    });

    test('maps buffers', () => {
        const res = intoAuthenticatorAssertionResponse(mockAssertion);
        expect(res.clientDataJSON).toEqual(new Uint8Array(mockAssertion.response.client_data_json).buffer);
        expect(res.authenticatorData).toEqual(new Uint8Array(mockAssertion.response.authenticator_data).buffer);
        expect(res.signature).toEqual(new Uint8Array(mockAssertion.response.signature).buffer);
        expect(res.userHandle).toEqual(new Uint8Array(mockAssertion.response.user_handle!).buffer);
    });

    test('userHandle is `null` when absent', () => {
        const res = intoAuthenticatorAssertionResponse({
            ...mockAssertion,
            response: { ...mockAssertion.response, user_handle: undefined },
        });
        expect(res.userHandle).toBeNull();
    });
});

describe('intoPublicKeyCredential', () => {
    test('instanceof `PublicKeyCredential`', () => {
        const res = intoAuthenticatorAttestationResponse(mockAttestation);
        expect(intoPublicKeyCredential(mockAttestation, res, identity)).toBeInstanceOf(PublicKeyCredential);
    });

    test('maps credential properties', () => {
        const res = intoAuthenticatorAttestationResponse(mockAttestation);
        const credential = intoPublicKeyCredential(mockAttestation, res, identity);
        expect(credential.id).toBe('credential-id');
        expect(credential.type).toBe('public-key');
        expect(credential.authenticatorAttachment).toBe('platform');
        expect(credential.rawId).toEqual(new Uint8Array(mockAttestation.raw_id).buffer);
        expect(credential.response).toBe(res);
    });

    test('`getClientExtensionResults()` returns credProps', () => {
        const res = intoAuthenticatorAttestationResponse(mockAttestation);
        const credential = intoPublicKeyCredential(mockAttestation, res, identity);
        expect(credential.getClientExtensionResults()).toEqual({ credProps: { rk: true } });
    });

    test('`getClientExtensionResults()` returns prf results', () => {
        const res = intoAuthenticatorAssertionResponse(mockAssertion);
        const { prf } = intoPublicKeyCredential(mockAssertion, res, identity).getClientExtensionResults();
        expect(prf?.enabled).toBe(true);
        expect(prf?.results?.first).toEqual(new Uint8Array(mockAssertion.client_extension_results.prf!.results!.first));
        expect(prf?.results?.second).toEqual(
            new Uint8Array(mockAssertion.client_extension_results.prf!.results!.second!)
        );
    });

    describe('toJSON', () => {
        test('resolves `clientExtensionResults` data', () => {
            const res = intoAuthenticatorAttestationResponse(mockAttestation);
            const json = (intoPublicKeyCredential(mockAttestation, res, identity) as any).toJSON();
            expect(typeof json.getClientExtensionResults).not.toBe('function');
            expect(json.clientExtensionResults).toEqual({ credProps: { rk: true } });
        });

        test('resolves prf results', () => {
            const res = intoAuthenticatorAssertionResponse(mockAssertion);
            const json = (intoPublicKeyCredential(mockAssertion, res, identity) as any).toJSON();
            expect(json.clientExtensionResults.prf?.enabled).toBe(true);
        });

        test('retains all other credential properties', () => {
            const res = intoAuthenticatorAttestationResponse(mockAttestation);
            const json = (intoPublicKeyCredential(mockAttestation, res, identity) as any).toJSON();
            expect(json.id).toBe('credential-id');
            expect(json.type).toBe('public-key');
            expect(json.authenticatorAttachment).toBe('platform');
            expect(json.rawId).toBeDefined();
            expect(json.response).toBeDefined();
        });

        /** Assertion response has no function own-properties so the toJSON output is
         * structuredClone-safe — i.e. page scripts can safely postMessage it to a worker. */
        test('output is structuredClone-safe', () => {
            const res = intoAuthenticatorAssertionResponse(mockAssertion);
            const json = (intoPublicKeyCredential(mockAssertion, res, identity) as any).toJSON();
            expect(() => structuredClone(json)).not.toThrow();
        });
    });
});
