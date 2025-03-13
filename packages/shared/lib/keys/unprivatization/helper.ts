import { getAllAddresses } from '../../api/addresses';
import { queryMemberUnprivatizationInfo } from '../../api/members';
import { getOrganizationIdentity, getOrganizationLogo } from '../../api/organization';
import type {
    Address,
    Api,
    MemberUnprivatizationOutput,
    Organization,
    OrganizationIdentityOutput,
} from '../../interfaces';
import { getOrganization, getOrganizationSettings } from '../../organization/api';

export interface OrganizationData {
    organization: Organization;
    organizationIdentity: OrganizationIdentityOutput;
    organizationLogo: { url: string; cleanup: () => void } | null;
}

export interface UnprivatizationContextData {
    organizationData: OrganizationData;
    addresses: Address[];
    data: MemberUnprivatizationOutput;
}

export const getOrganizationData = async ({ api }: { api: Api }): Promise<OrganizationData> => {
    const [organization, organizationIdentity, organizationLogo] = await Promise.all([
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
            .then(async ({ LogoID }): Promise<OrganizationData['organizationLogo']> => {
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
    ]);

    return {
        organization,
        organizationIdentity,
        organizationLogo,
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
