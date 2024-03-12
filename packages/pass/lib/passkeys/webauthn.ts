import type { WasmPublicKeyCredentialAssertion, WasmPublicKeyCredentialAttestation } from '@protontech/pass-rust-core';

export const intoAuthenticatorAttestationResponse = ({
    response,
}: WasmPublicKeyCredentialAttestation): AuthenticatorAttestationResponse =>
    Object.setPrototypeOf(
        {
            attestationObject: new Uint8Array(response.attestation_object).buffer,
            clientDataJSON: new Uint8Array(response.client_data_json).buffer,
            getAuthenticatorData: () => new Uint8Array(response.authenticator_data).buffer,
            getPublicKey: () => (response.public_key ? new Uint8Array(response.public_key).buffer : null),
            getPublicKeyAlgorithm: () => response.public_key_algorithm,
            getTransports: () => response?.transports ?? [],
        },
        AuthenticatorAttestationResponse.prototype
    );

export const intoAuthenticatorAssertionResponse = (
    credential: WasmPublicKeyCredentialAssertion
): AuthenticatorAssertionResponse =>
    Object.setPrototypeOf(
        {
            clientDataJSON: new Uint8Array(credential.response.client_data_json).buffer,
            authenticatorData: new Uint8Array(credential.response.authenticator_data).buffer,
            signature: new Uint8Array(credential.response.signature).buffer,
            userHandle: credential.response.user_handle ? new Uint8Array(credential.response.user_handle).buffer : null,
        },
        AuthenticatorAttestationResponse.prototype
    );

export const intoPublicKeyCredential = (
    result: WasmPublicKeyCredentialAttestation | WasmPublicKeyCredentialAssertion,
    response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse
): PublicKeyCredential =>
    Object.setPrototypeOf(
        {
            authenticatorAttachment: result.authenticator_attachment,
            id: result.id,
            rawId: new Uint8Array(result.raw_id).buffer,
            response,
            type: result.type,
            getClientExtensionResults: () => result.client_extension_results ?? {},
        },
        PublicKeyCredential.prototype
    );
