import { getAllAddresses } from '../../api/addresses';
import { queryMemberUnprivatizationInfo } from '../../api/members';
import { getOrganization, getOrganizationLogo, getOrganizationSettings } from '../../api/organization';
import type { Address, Api, MemberUnprivatizationOutput, Organization, OrganizationSettings } from '../../interfaces';

export interface UnprivatizationContextData {
    organization: Organization;
    organizationLogoUrl: string | null;
    addresses: Address[];
    data: MemberUnprivatizationOutput;
}

export const getUnprivatizationContextData = async ({ api }: { api: Api }): Promise<UnprivatizationContextData> => {
    const [organization, organizationLogoUrl, addresses, data] = await Promise.all([
        api<{ Organization: Organization }>(getOrganization()).then(({ Organization }) => Organization),
        api<OrganizationSettings>(getOrganizationSettings())
            .then(async ({ LogoID }): Promise<null | string> => {
                if (!LogoID) {
                    return null;
                }
                const result = await api<Blob>({ ...getOrganizationLogo(LogoID), output: 'blob' });
                return URL.createObjectURL(result);
            })
            .catch(() => {
                return null;
            }),
        getAllAddresses(api),
        api<MemberUnprivatizationOutput>(queryMemberUnprivatizationInfo()),
    ]);

    return {
        organization,
        organizationLogoUrl,
        addresses,
        data,
    };
};
