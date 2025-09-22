import { arrayToBinaryString, encodeBase64 } from '@proton/crypto/lib/utils';

import type {
    AuthenticationCredentialsPayload,
    AuthenticationOptions,
    PublicKeyCredentialRequestOptionsSerialized,
} from './interface';

export * from './interface';

const convertRequestToExpectedFormat = (
    publicKey: PublicKeyCredentialRequestOptionsSerialized
): CredentialRequestOptions => {
    const { challenge, allowCredentials, ...rest } = publicKey;

    return {
        publicKey: {
            ...rest,
            challenge: new Uint8Array(challenge).buffer,
            allowCredentials: allowCredentials?.map((credentials) => ({
                ...credentials,
                id: new Uint8Array(credentials.id),
            })),
        },
    };
};

export const getAuthentication = async (
    authenticationOptions: AuthenticationOptions,
    signal: AbortSignal
): Promise<AuthenticationCredentialsPayload> => {
    const credentialRequestOptions = convertRequestToExpectedFormat(authenticationOptions.publicKey);
    const credentials = await navigator.credentials.get({ ...credentialRequestOptions, signal });
    const publicKeyCredentials = credentials as PublicKeyCredential;
    if (!credentials || !('rawId' in credentials)) {
        throw new Error('No credentials received, unsupported browser');
    }
    const response = publicKeyCredentials.response as AuthenticatorAttestationResponse & {
        signature: ArrayBuffer;
        authenticatorData: ArrayBuffer;
    };
    return {
        AuthenticationOptions: authenticationOptions,
        ClientData: response.clientDataJSON
            ? encodeBase64(arrayToBinaryString(new Uint8Array(response.clientDataJSON)))
            : null!,
        AuthenticatorData: response.authenticatorData
            ? encodeBase64(arrayToBinaryString(new Uint8Array(response.authenticatorData)))
            : null!,
        Signature: response.signature ? encodeBase64(arrayToBinaryString(new Uint8Array(response.signature))) : null!,
        CredentialID: publicKeyCredentials.rawId ? [...new Uint8Array(publicKeyCredentials.rawId)] : null!,
    };
};
