import { getPasswordPolicies } from '@proton/shared/lib/api/passwordPolicies';

import { getAllAddresses } from '../../api/addresses';
import { queryMemberUnprivatizationInfo } from '../../api/members';
import { getOrganizationIdentity, getOrganizationLogo } from '../../api/organization';
import type {
    Address,
    Api,
    MemberUnprivatizationOutput,
    Organization,
    OrganizationIdentityOutput,
    PasswordPolicies,
} from '../../interfaces';
import { getOrganization, getOrganizationSettings } from '../../organization/api';

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
