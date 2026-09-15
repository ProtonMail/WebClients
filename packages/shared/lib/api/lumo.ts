export const getRemainingInvitations = () => ({
    method: 'get',
    url: `lumo/v1/invitation/remaining`,
});

export const getLatestLumoEventID = () => ({
    method: 'get',
    url: `lumo/v1/events/latest`,
});

export const getLumoEvents = (eventID: string) => ({
    method: 'get',
    url: `lumo/v1/events/${eventID}`,
});
