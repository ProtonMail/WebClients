export enum PREDEFINED_ROLE_NAME {
    OWNER = 'Owner',
    USER_ADMIN = 'User Admin',
    SECURITY_ADMIN = 'Security Admin',
}

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

export interface RoleAssignment {
    OrganizationID: string;
    AssignmentTime: number;
    Role: OrganizationRole;
    Source: ROLE_SOURCE;
    SourceID: string;
    SourceGroupName: string | null;
}

/**
 * Predefined role names whose assignment requires the holder to have ReadOrgKey permission.
 * This hard-coded value will be removed soon after BE returns required permissions for each admin role.
 */
export const ROLE_NAMES_REQUIRING_ORG_KEY: Set<string> = new Set<string>([
    PREDEFINED_ROLE_NAME.OWNER,
    PREDEFINED_ROLE_NAME.USER_ADMIN,
]);
