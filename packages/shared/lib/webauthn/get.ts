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
        ClientData: response.clientDataJSON ? new Uint8Array(response.clientDataJSON).toBase64() : null!,
        AuthenticatorData: response.authenticatorData ? new Uint8Array(response.authenticatorData).toBase64() : null!,
        Signature: response.signature ? new Uint8Array(response.signature).toBase64() : null!,
        CredentialID: publicKeyCredentials.rawId ? [...new Uint8Array(publicKeyCredentials.rawId)] : null!,
    };
};
