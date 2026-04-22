export enum ROLE_SOURCE {
    USER = 'user',
    GROUP = 'group',
}

export interface OrganizationRole {
    OrganizationRoleID: string;
    OrganizationID: string;
    Name: string;
    Description: string | null;
    Flags: number;
    CreateTime: number;
    UpdateTime: number;
}

export interface UserOrganizationRole {
    OrganizationID: string;
    AssignmentTime: number;
    Role: OrganizationRole;
    Source: ROLE_SOURCE;
    SourceID: string;
    SourceGroupName: string | null;
}
