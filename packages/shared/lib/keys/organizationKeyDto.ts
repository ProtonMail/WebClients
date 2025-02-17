export interface OrganizationKeyActivation {
    TokenKeyPacket: string;
    Signature: string;
}

export interface OrganizationKeyInvitation {
    TokenKeyPacket: string;
    Signature: string;
    SignatureAddressID: string;
    EncryptionAddressID: string;
}
