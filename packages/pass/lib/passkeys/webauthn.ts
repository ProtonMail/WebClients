import type {
    WasmPublicKeyCredentialAssertion,
    WasmPublicKeyCredentialAttestation,
} from '@protontech/pass-rust-core/worker';

import { SafeUint8Array } from '@proton/pass/utils/buffer/sanitization';

export const intoAuthenticatorAttestationResponse = ({
    response,
}: WasmPublicKeyCredentialAttestation): AuthenticatorAttestationResponse =>
    Object.setPrototypeOf(
        {
            attestationObject: new SafeUint8Array(response.attestation_object).buffer,
            clientDataJSON: new SafeUint8Array(response.client_data_json).buffer,
            getAuthenticatorData: () => new SafeUint8Array(response.authenticator_data).buffer,
            getPublicKey: () => (response.public_key ? new SafeUint8Array(response.public_key).buffer : null),
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
            clientDataJSON: new SafeUint8Array(credential.response.client_data_json).buffer,
            authenticatorData: new SafeUint8Array(credential.response.authenticator_data).buffer,
            signature: new SafeUint8Array(credential.response.signature).buffer,
            userHandle: credential.response.user_handle
                ? new SafeUint8Array(credential.response.user_handle).buffer
                : null,
        },
        AuthenticatorAssertionResponse.prototype
    );

export const intoPublicKeyCredential = (
    result: WasmPublicKeyCredentialAttestation | WasmPublicKeyCredentialAssertion,
    response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse,
    clone: <T>(obj: T) => T
): PublicKeyCredential => {
    const publicKeyCredential = {
        authenticatorAttachment: result.authenticator_attachment,
        id: result.id,
        rawId: new SafeUint8Array(result.raw_id).buffer,
        response,
        type: result.type,
        getClientExtensionResults: (): AuthenticationExtensionsClientOutputs => {
            const res: AuthenticationExtensionsClientOutputs = {};
            const credProps = result.client_extension_results.credProps;
            const prf = result.client_extension_results.prf;

            if (credProps) res.credProps = credProps;

            if (prf) {
                res.prf = {};
                if (prf.enabled) res.prf.enabled = prf.enabled;

                if (prf.results) {
                    const { first } = prf.results;
                    const results: AuthenticationExtensionsPRFValues = { first: new SafeUint8Array(first) };
                    if (prf?.results?.second) results.second = new SafeUint8Array(prf.results.second);

                    res.prf.results = results;
                }
            }

            return clone(res);
        },
    };

    return Object.setPrototypeOf(
        {
            ...publicKeyCredential,
            toJSON: () => {
                const { getClientExtensionResults, ...data } = publicKeyCredential;
                return clone({ ...data, clientExtensionResults: getClientExtensionResults() });
            },
        },
        PublicKeyCredential.prototype
    );
};
