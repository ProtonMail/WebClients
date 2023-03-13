import { Address, Api, Member } from '../interfaces';
import queryPages from './helpers/queryPages';
import { PaginationParams } from './interface';

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

export const createMember = (data: { Name: string; Private: number; MaxSpace: number; MaxVPN: number }) => ({
    method: 'post',
    url: 'core/v4/members',
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

export const updateVPN = (memberID: string, MaxVPN: number) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/vpn`,
    data: { MaxVPN },
});

export const removeMember = (memberID: string) => ({
    method: 'delete',
    url: `core/v4/members/${memberID}`,
});

export const privatizeMember = (memberID: string) => ({
    method: 'put',
    url: `core/v4/members/${memberID}/privatize`,
});

export const authMember = (memberID: string) => ({
    method: 'post',
    url: `core/v4/members/${memberID}/auth`,
});
