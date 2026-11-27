import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { queryMemberUnprivatizationInfo } from '@proton/shared/lib/api/members';
import { getOrganizationIdentity, getOrganizationLogo } from '@proton/shared/lib/api/organization';
import { getPasswordPolicies } from '@proton/shared/lib/api/passwordPolicies';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { MemberUnprivatizationOutput } from '@proton/shared/lib/interfaces/Member';
import type { Organization, OrganizationIdentityOutput } from '@proton/shared/lib/interfaces/Organization';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces/PasswordPolicy';
import { getOrganization, getOrganizationSettings } from '@proton/shared/lib/organization/api';

export interface OrganizationData {
    organization: Organization;
    identity: OrganizationIdentityOutput;
    logo: { url: string; cleanup: () => void } | null;
    passwordPolicies: PasswordPolicies;
}

export interface UnprivatizationContextData {
    organizationData: OrganizationData;
    addresses: Address[];
    data: MemberUnprivatizationOutput;
}

export const getOrganizationData = async ({ api }: { api: Api }): Promise<OrganizationData> => {
    const [organization, identity, logo, passwordPolicies] = await Promise.all([
        getOrganization({ api }),
        api<OrganizationIdentityOutput>(getOrganizationIdentity())
            .then((output) => output)
            .catch((): OrganizationIdentityOutput => {
                return {
                    PublicKey: null,
                    FingerprintSignature: null,
                    FingerprintSignatureAddress: null,
                };
            }),
        getOrganizationSettings({ api })
            .then(async ({ LogoID }): Promise<OrganizationData['logo']> => {
                if (!LogoID) {
                    return null;
                }
                const result = await api<Blob>({ ...getOrganizationLogo(LogoID), output: 'blob' });
                const url = URL.createObjectURL(result);
                return {
                    url,
                    cleanup: () => URL.revokeObjectURL(url),
                };
            })
            .catch(() => {
                return null;
            }),
        getPasswordPolicies({ api }),
    ]);

    return {
        organization,
        identity,
        logo,
        passwordPolicies,
    };
};

export const getUnprivatizationContextData = async ({ api }: { api: Api }): Promise<UnprivatizationContextData> => {
    const [organizationData, addresses, data] = await Promise.all([
        getOrganizationData({ api }),
        getAllAddresses(api),
        api<MemberUnprivatizationOutput>(queryMemberUnprivatizationInfo()),
    ]);

    return {
        organizationData,
        addresses,
        data,
    };
};
