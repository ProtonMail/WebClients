export const getLatestID = () => ({
    url: 'v4/events/latest',
    method: 'get'
});

export const getEvents = (eventID) => ({
    url: `v4/events/${eventID}`,
    method: 'get'
});
