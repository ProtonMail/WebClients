export const queryMembers = () => ({
    method: 'get',
    url: 'members'
});

export const getMember = (ID) => ({
    method: 'get',
    url: `members/${ID}`
});

export const queryAddresses = (ID) => ({
    method: 'get',
    url: `members/${ID}/addresses`
});

export const createMember = (data) => ({
    method: 'post',
    url: 'members',
    data
});

export const createMemberAddress = (ID, data) => ({
    method: 'post',
    url: `members/${ID}/addresses`,
    data
});

export const updateName = (ID, Name) => ({
    method: 'put',
    url: `members/${ID}/name`,
    data: { Name }
});

export const updateQuota = (ID, MaxSpace) => ({
    method: 'put',
    url: `members/${ID}/quota`,
    data: { MaxSpace }
});

export const updateRole = (ID, Role) => ({
    method: 'put',
    url: `members/${ID}/role`,
    data: { Role }
});

export const updateVPN = (ID, MaxVPN) => ({
    method: 'put',
    url: `members/${ID}/vpn`,
    data: { MaxVPN }
});