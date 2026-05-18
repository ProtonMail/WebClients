export const getOrganizationRoles = () => ({
    method: 'get',
    url: 'permissions/v1/roles',
});

export const getMemberOrganizationRoles = (memberID: string) => ({
    method: 'get',
    url: `permissions/v1/members/${memberID}/roles`,
});

export const getGroupOrganizationRoles = (groupID: string) => ({
    method: 'get',
    url: `permissions/v1/groups/${groupID}/roles`,
});
