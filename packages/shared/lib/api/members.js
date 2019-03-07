export const queryMembers = () => ({
    method: 'get',
    url: 'members'
});

export const getMember = (memberID) => ({
    method: 'get',
    url: `members/${memberID}`
});

export const queryAddresses = (memberID) => ({
    method: 'get',
    url: `members/${memberID}/addresses`
});

export const createMember = (data) => ({
    method: 'post',
    url: 'members',
    data
});

export const createMemberAddress = (memberID, data) => ({
    method: 'post',
    url: `members/${memberID}/addresses`,
    data
});

export const updateName = (memberID, Name) => ({
    method: 'put',
    url: `members/${memberID}/name`,
    data: { Name }
});

export const updateQuota = (memberID, MaxSpace) => ({
    method: 'put',
    url: `members/${memberID}/quota`,
    data: { MaxSpace }
});

export const updateRole = (memberID, Role) => ({
    method: 'put',
    url: `members/${memberID}/role`,
    data: { Role }
});

export const updateVPN = (memberID, MaxVPN) => ({
    method: 'put',
    url: `members/${memberID}/vpn`,
    data: { MaxVPN }
});

export const removeMember = (memberID) => ({
    method: 'delete',
    url: `members/${memberID}`
});
