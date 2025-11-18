import type {
    PublicKeyCredentialCreationOptionsSerialized,
    RegisterCredentials,
    RegisterCredentialsPayload,
} from './interface';

export * from './interface';

const convertCreationToExpectedFormat = (
    publicKey: PublicKeyCredentialCreationOptionsSerialized
): CredentialCreationOptions => {
    const { challenge, user, excludeCredentials, ...rest } = publicKey;

    return {
        publicKey: {
            ...rest,
            challenge: new Uint8Array(challenge).buffer,
            user: {
                ...user,
                id: new Uint8Array(user.id),
            },
            excludeCredentials: excludeCredentials?.map((credentials) => ({
                ...credentials,
                id: new Uint8Array(credentials.id),
            })),
        },
    };
};

export const getCreatePayload = async (
    registerCredentials: RegisterCredentials,
    signal: AbortSignal
): Promise<RegisterCredentialsPayload> => {
    const credentialCreationOptions = convertCreationToExpectedFormat(
        registerCredentials.RegistrationOptions.publicKey
    );
    const credentials = await navigator.credentials.create({ ...credentialCreationOptions, signal });
    const publicKeyCredentials = credentials as PublicKeyCredential;
    if (!credentials || !('rawId' in credentials) || !('attestationObject' in publicKeyCredentials.response)) {
        throw new Error('No credentials received');
    }
    const response = publicKeyCredentials.response as AuthenticatorAttestationResponse & {
        getTransports: () => string[];
    };
    return {
        RegistrationOptions: registerCredentials.RegistrationOptions,
        ClientData: response.clientDataJSON ? new Uint8Array(response.clientDataJSON).toBase64() : null!,
        AttestationObject: response.attestationObject ? new Uint8Array(response.attestationObject).toBase64() : null!,
        Transports: response.getTransports?.() || [],
        Name: '',
    };
};
