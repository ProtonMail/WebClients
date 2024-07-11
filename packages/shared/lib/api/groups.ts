import { Address, GroupFlags, GroupPermissions } from '../interfaces';

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
