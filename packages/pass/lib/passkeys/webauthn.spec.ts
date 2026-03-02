import type {
    WasmPublicKeyCredentialAssertion,
    WasmPublicKeyCredentialAttestation,
} from '@protontech/pass-rust-core/worker';

import { uint8ArrayToB64URL } from '@proton/pass/utils/buffer/sanitization';

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
        const b64url = (bytes: number[]) => uint8ArrayToB64URL(new Uint8Array(bytes));

        const attestationJSON = () => {
            const res = intoAuthenticatorAttestationResponse(mockAttestation);
            return (intoPublicKeyCredential(mockAttestation, res, identity) as any).toJSON();
        };

        const assertionJSON = () => {
            const res = intoAuthenticatorAssertionResponse(mockAssertion);
            return (intoPublicKeyCredential(mockAssertion, res, identity) as any).toJSON();
        };

        test('base64url-encodes credential fields', () => {
            const json = attestationJSON();
            expect(json.rawId).toBe(b64url(mockAttestation.raw_id));
            expect(json.id).toBe('credential-id');
            expect(json.type).toBe('public-key');
            expect(json.authenticatorAttachment).toBe('platform');
        });

        test('resolves clientExtensionResults with base64url prf values', () => {
            expect(attestationJSON().clientExtensionResults).toEqual({ credProps: { rk: true } });

            const json = assertionJSON();
            expect(json.clientExtensionResults.prf?.enabled).toBe(true);
            expect(json.clientExtensionResults.prf?.results?.first).toBe(b64url([7, 8, 9]));
            expect(json.clientExtensionResults.prf?.results?.second).toBe(b64url([10, 11, 12]));
        });

        test('attestation response includes base64url buffers and getter outputs', () => {
            const { response } = attestationJSON();
            expect(response.attestationObject).toBe(b64url(mockAttestation.response.attestation_object));
            expect(response.clientDataJSON).toBe(b64url(mockAttestation.response.client_data_json));
            expect(response.authenticatorData).toBe(b64url(mockAttestation.response.authenticator_data));
            expect(response.publicKey).toBe(b64url(mockAttestation.response.public_key!));
            expect(response.publicKeyAlgorithm).toBe(-7);
            expect(response.transports).toEqual(['internal']);
        });

        test('assertion response base64url-encodes all buffer fields', () => {
            const { response } = assertionJSON();
            expect(response.clientDataJSON).toBe(b64url(mockAssertion.response.client_data_json));
            expect(response.authenticatorData).toBe(b64url(mockAssertion.response.authenticator_data));
            expect(response.signature).toBe(b64url(mockAssertion.response.signature));
            expect(response.userHandle).toBe(b64url(mockAssertion.response.user_handle!));
        });

        test('output is structuredClone-safe', () => {
            expect(() => structuredClone(attestationJSON())).not.toThrow();
            expect(() => structuredClone(assertionJSON())).not.toThrow();
        });
    });
});
