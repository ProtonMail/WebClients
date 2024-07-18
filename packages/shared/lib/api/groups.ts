import { Address, GroupFlags, GroupPermissions } from '../interfaces';

interface GroupParameters {
    Name: string;
    Email: string;
    ParentGroup?: string;
    Permissions: number;
    Description: string;
    Flags: GroupFlags;
}

export const createGroup = (groupParams: GroupParameters) => ({
    method: 'post',
    url: 'core/v4/groups',
    data: {
        ...groupParams,
    },
});

export interface GroupResult {
    ID: string;
    Name: string;
    Description: string;
    Address: Address;
    CreateTime: number;
    Permissions: GroupPermissions;
    Flags: GroupFlags;
}

export const getGroups = () => ({
    method: 'get',
    url: 'core/v4/groups',
});
