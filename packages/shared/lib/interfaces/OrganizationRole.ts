export interface OrganizationRole {
    OrganizationRoleID: string;
    OrganizationID: string;
    Name: string;
    Description: string | null;
    Flags: number;
    CreateTime: number;
    UpdateTime: number;
}
