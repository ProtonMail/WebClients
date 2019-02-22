export const getLatestID = () => ({
    url: 'events/latest',
    method: 'get'
});

export const getEvents = (eventID) => ({
    url: `events/${eventID}`,
    method: 'get'
});