import type { OrganizationKeyActivation } from './organizationKeyDto';

export interface UnprivatizeMemberUserKeyDto {
    OrgPrivateKey: string;
    OrgToken: string;
}

export interface UnprivatizeMemberAddressKeyDto {
    AddressKeyID: string;
    OrgSignature: string;
    OrgTokenKeyPacket: string;
}

export interface UnprivatizeMemberPayload {
    UserKeys: UnprivatizeMemberUserKeyDto[];
    AddressKeys: UnprivatizeMemberAddressKeyDto[];
    OrganizationKeyActivation?: OrganizationKeyActivation;
}
