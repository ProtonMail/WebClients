export interface PublicKeyCredentialUserEntitySerialized extends Omit<PublicKeyCredentialUserEntity, 'id'> {
    id: number[];
}

export interface PublicKeyCredentialDescriptorSerialized extends Omit<PublicKeyCredentialDescriptor, 'id'> {
    id: number[];
}

export interface PublicKeyCredentialCreationOptionsSerialized extends Omit<
    PublicKeyCredentialCreationOptions,
    'challenge' | 'user' | 'excludeCredentials'
> {
    challenge: number[];
    user: PublicKeyCredentialUserEntitySerialized;
    excludeCredentials?: PublicKeyCredentialDescriptorSerialized[];
}

export interface RegistrationOptions {
    publicKey: PublicKeyCredentialCreationOptionsSerialized;
}

export interface PublicKeyCredentialRequestOptionsSerialized extends Omit<
    PublicKeyCredentialRequestOptions,
    'challenge' | 'allowCredentials'
> {
    challenge: number[];
    allowCredentials: PublicKeyCredentialDescriptorSerialized[];
}

export interface AuthenticationOptions {
    publicKey: PublicKeyCredentialRequestOptionsSerialized;
}

export enum AttestationFormat {
    None = 'none',
    AndroidKey = 'android-key',
    AndroidSafetyNet = 'android-safetynet',
    Apple = 'apple',
    FidoU2F = 'fido-u2f',
    Packed = 'packed',
    TPM = 'tpm',
}

export enum Fido2CredentialFlags {
    // Bitmask
    Compromised = 1,
}

export interface RegisteredKey {
    AttestationFormat: AttestationFormat;
    CredentialID: number[];
    Name: string;
    Flags: Fido2CredentialFlags;
}

export interface RegisterCredentials {
    RegisteredKeys: RegisteredKey[];
    RegistrationOptions: RegistrationOptions;
    AttestationFormats: AttestationFormat[];
}

export interface RegisterCredentialsPayload {
    RegistrationOptions: RegistrationOptions;
    ClientData: string;
    AttestationObject: string;
    Transports: string[];
    Name: string;
}

export interface AuthenticationCredentialsPayload {
    AuthenticationOptions: AuthenticationOptions;
    ClientData: string;
    AuthenticatorData: string;
    Signature: string;
    CredentialID: number[];
}
