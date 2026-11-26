export interface MembersLumoApiResponse {
    Total: number;
    Members: { MemberID: string; LumoApiEnabled: boolean }[];
}

export const MEMBERS_LUMO_API_MAX_PAGE_SIZE = 150;

export const getMembersLumoApiRequest = (params: { Page: number; PageSize: number }) => ({
    url: 'core/v4/members/lumo-api',
    method: 'get' as const,
    params,
});

export const updateMemberLumoApiRequest = (memberId: string, LumoApiEnabled: boolean) => ({
    url: `core/v4/members/${memberId}/lumo-api`,
    method: 'put' as const,
    data: { LumoApiEnabled },
});

export const updateAllMembersLumoApiRequest = (LumoApiEnabled: boolean) => ({
    url: 'core/v4/members/lumo-api',
    method: 'put' as const,
    data: { LumoApiEnabled, AllMembers: true },
});
