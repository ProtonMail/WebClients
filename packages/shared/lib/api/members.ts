import { PaginationParams } from './interface';
import { Address, Api, Member } from '../interfaces';
import queryPages from './helpers/queryPages';

export const queryMembers = (params?: PaginationParams) => ({
    method: 'get',
    url: 'members',
    params,
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
    url: `members/${memberID}`,
});

export const queryAddresses = (memberID: string, params?: PaginationParams) => ({
    method: 'get',
    url: `members/${memberID}/addresses`,
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
    url: 'members',
    data,
});

export const createMemberAddress = (memberID: string, data: { Local: string; Domain: string }) => ({
    method: 'post',
    url: `members/${memberID}/addresses`,
    data,
});

export const updateName = (memberID: string, Name: string) => ({
    method: 'put',
    url: `members/${memberID}/name`,
    data: { Name },
});

export const updateQuota = (memberID: string, MaxSpace: number) => ({
    method: 'put',
    url: `members/${memberID}/quota`,
    data: { MaxSpace },
});

export const updateRole = (memberID: string, Role: number) => ({
    method: 'put',
    url: `members/${memberID}/role`,
    data: { Role },
});

export const updateVPN = (memberID: string, MaxVPN: number) => ({
    method: 'put',
    url: `members/${memberID}/vpn`,
    data: { MaxVPN },
});

export const removeMember = (memberID: string) => ({
    method: 'delete',
    url: `members/${memberID}`,
});

export const privatizeMember = (memberID: string) => ({
    method: 'put',
    url: `members/${memberID}/privatize`,
});

export const authMember = (memberID: string) => ({
    method: 'post',
    url: `members/${memberID}/auth`,
});
