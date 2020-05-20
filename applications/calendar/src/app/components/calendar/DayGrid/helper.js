export const getEvent = (idx, eventsInRow, events) => {
    const { idx: eventIdx } = eventsInRow[idx];
    return events[eventIdx];
};
