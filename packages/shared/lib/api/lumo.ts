export const joinLumoWaitlist = () => ({
    method: 'post',
    url: `lumo/v1/waitlist`,
});

export const getRemainingInvitations = () => ({
    method: 'get',
    url: `lumo/v1/invitation/remaining`,
});

export interface LumoInvitationBody {
    Email: string;
    InviterAddressID: string;
}

export const sendLumoInvitation = (data: LumoInvitationBody) => ({
    method: 'post',
    url: `lumo/v1/invitation`,
    data,
});
