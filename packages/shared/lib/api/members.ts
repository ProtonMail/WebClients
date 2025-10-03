import type { Address, Api, Member, SignedKeyList } from '../interfaces';
import type { OrganizationKeyActivation, OrganizationKeyInvitation } from '../keys/organizationKeyDto';
import type { UnprivatizeMemberPayload } from '../keys/unprivatization';
import queryPages from './helpers/queryPages';
import type { PaginationParams } from './interface';

export const queryMembers = (params?: PaginationParams) => ({
    method: 'get',
    url: 'core/v4/members',
    params: {
        ...params,
        IncludeAddresses: 1,
    },
});

export const getAllMembers = (api: Api) => {
    return queryPages((Page, PageSize) => {
        return api<{ Members: Member[]; Total: number }>(
            queryMembers({
                Page,
                PageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Members }) => Members);
    });
};

export const getMember = (memberID: string) => ({
    method: 'get',
    url: `core/v4/members/${memberID}`,
});

export const getSelfMember = () => ({
    method: 'get',
    url: 'core/v4/members/me',
});

export const queryAddresses = (memberID: string, params?: PaginationParams) => ({
    method: 'get',
    url: `core/v4/members/${memberID}/addresses`,
    params,
});

export const getAllMemberAddresses = (api: Api, memberID: string) => {
    return queryPages((page, pageSize) => {
        return api<{ Addresses: Address[]; Total: number }>(
            queryAddresses(memberID, {
                Page: page,
                PageSize: pageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Addresses = [] }) => Addresses);
    });
};

interface MemberPayload {
    Name: string;
    Private: number;
    MaxSpace: number;
    MaxVPN: number;
    MaxAI: number;
}

interface UnprivatizationInvitation {
    Email: string;
    Data: string;
    Signature: string;
    PrivateIntent: boolean;
}

interface InviteMemberPayload extends Omit<MemberPayload, 'Private'> {
    Invitation: UnprivatizationInvitation;
}

export const createMember = (data: MemberPayload | InviteMemberPayload) => ({
    method: 'post',
    url: 'core/v4/members',
    data,
});

export const queryMemberUnprivatizationInfo = () => ({
    method: 'get',
    url: `core/v4/members/me/unprivatize`,
});
export const acceptMemberUnprivatizationInfo = (data: { OrgUserKeys: string[]; OrgActivationToken: string }) => ({
    method: 'post',
    url: `core/v4/members/me/unprivatize`,
    data,
});

export const deleteMemberUnprivatizationInfo = () => ({
    method: 'delete',
    url: `core/v4/members/me/unprivatize`,
});

export const unprivatizeMemberKeysRoute = (memberID: string, data: UnprivatizeMemberPayload) => ({
    method: 'post',
    url: `core/v4/members/${memberID}/keys/unprivatize`,
    data,
});

export const checkMemberAddressAvailability = (data: { Local: string; Domain: string }) => ({
    method: 'post',
    url: `core/v4/members/addresses/available`,
    data,
});

export const createMemberAddress = (memberID: string, data: { Local: string; Domain: string }) => ({
    method: 'post',
    url: `core/v4/members/${memberID}/addresses`,
    data,
});

export const updateName = (memberID: string, Name: string) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/name`,
    data: { Name },
});

export const updateQuota = (memberID: string, MaxSpace: number) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/quota`,
    data: { MaxSpace },
});

export const updateRole = (memberID: string, Role: number) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/role`,
    data: { Role },
});

export const activatePasswordlessKey = (data: OrganizationKeyActivation) => ({
    method: 'put',
    url: `core/v4/organizations/keys/activate`,
    data,
});

export const updateRolePasswordless = ({
    memberID,
    ...data
}: {
    memberID: string;
    Role: number;
} & (
    | {
          OrganizationKeyActivation: OrganizationKeyActivation;
      }
    | {
          OrganizationKeyInvitation: OrganizationKeyInvitation;
      }
)) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/role`,
    data,
});

export const updateVPN = (memberID: string, MaxVPN: number) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/vpn`,
    data: { MaxVPN },
});

export const updateAI = (memberID: string, MaxAI: number) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/ai`,
    data: { MaxAI },
});

export const updateLumo = (memberID: string, MaxLumo: number) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/lumo`,
    data: { MaxLumo },
});

export interface RequestMemberUnprivatizationInput {
    InvitationData: string;
    InvitationSignature: string;
}

export const requestUnprivatization = (memberID: string, data: RequestMemberUnprivatizationInput) => ({
    method: 'post',
    url: `core/v4/members/${memberID}/unprivatize`,
    data,
});

export const deleteUnprivatizationRequest = (memberID: string) => ({
    method: 'delete',
    url: `core/v4/members/${memberID}/unprivatize`,
});

export const resendUnprivatizationLink = (memberID: string) => ({
    method: 'post',
    url: `core/v4/members/${memberID}/unprivatize/resend`,
});

export const privatizeMember = (memberID: string) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/privatize`,
});

export const authMember = (memberID: string, data: { Unlock?: boolean } = {}) => ({
    method: 'post',
    url: `core/v4/members/${memberID}/auth`,
    data,
});

export const inviteMember = ({
    email,
    maxSpace,
    maxAI,
    maxLumo,
}: {
    email: string;
    maxSpace: number;
    maxAI?: number;
    maxLumo?: number;
}) => ({
    url: `core/v4/members/invitations`,
    method: 'post',
    data: {
        Email: email,
        MaxSpace: maxSpace,
        MaxAI: maxAI,
        MaxLumo: maxLumo,
    },
});

export const deleteMember = (memberId: string) => ({
    url: `core/v4/members/${memberId}`,
    method: 'delete',
});

export const disableMember = (memberID: string) => ({
    url: `core/v4/members/${memberID}/disable`,
    method: 'put',
});

export const enableMember = (memberID: string) => ({
    url: `core/v4/members/${memberID}/enable`,
    method: 'put',
});

export const removeSSOSamlMember = (memberID: string) => ({
    url: `core/v4/members/${memberID}/saml`,
    method: 'delete',
});

export const addSSOSamlMember = (memberID: string) => ({
    url: `core/v4/members/${memberID}/saml`,
    method: 'post',
});

export const editMemberInvitation = (memberID: string, maxSpace: number) => ({
    method: 'put',
    url: `core/v4/members/invitations/${memberID}`,
    data: {
        MaxSpace: maxSpace,
    },
});

export const updateAddressFlags = (
    addressID: string,
    Encrypt: boolean,
    Sign: boolean,
    SignedKeyList: SignedKeyList
) => ({
    method: 'put',
    url: `core/v4/addresses/${addressID}/encryption`,
    data: {
        Encrypt: Encrypt ? 1 : 0,
        Sign: Sign ? 1 : 0,
        SignedKeyList,
    },
});
