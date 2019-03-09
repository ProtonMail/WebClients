export const createInvitation = ({ Email, Type } = {}) => ({
    method: 'post',
    url: 'invites',
    data: { Email, Type }
});
