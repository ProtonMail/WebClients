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

export const updateMemberOrganizationRoles = (
    memberID: string,
    { add, remove }: { add: string[]; remove: string[] }
) => ({
    method: 'put',
    url: `permissions/v1/members/${memberID}/roles`,
    data: {
        Add: add,
        Remove: remove,
    },
});

export const updateGroupOrganizationRoles = (
    groupID: string,
    { add, remove }: { add: string[]; remove: string[] }
) => ({
    method: 'put',
    url: `permissions/v1/groups/${groupID}/roles`,
    data: {
        Add: add,
        Remove: remove,
    },
});
