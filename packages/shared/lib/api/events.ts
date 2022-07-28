export const getLatestID = () => ({
    url: 'v4/events/latest',
    method: 'get',
});

export const getEvents = (eventID: string, params?: { ConversationCounts: 1 | 0; MessageCounts: 1 | 0 }) => ({
    url: `v4/events/${eventID}`,
    method: 'get',
    params,
});
