export const createInvitation = ({ Email, Type } = {}) => ({
    method: 'post',
    url: 'invites',
    data: { Email, Type }
});

export const checkInvitation = (data) => ({
    method: 'post',
    url: 'invites/check',
    data
});
