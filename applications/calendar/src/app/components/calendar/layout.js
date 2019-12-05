const isAllDayPrio = (a, b) => {
    return a.start.getUTCDate() === b.end.getUTCDate() && a.isAllDay && !b.isAllDay;
};

export const sortEvents = (events) => {
    return events.sort((a, b) => {
        // Sort all day (and cross day events) events before
        if (isAllDayPrio(a, b)) {
            return -1;
        }
        if (isAllDayPrio(b, a)) {
            return 1;
        }
        return a.start - b.start || b.end - a.end;
    });
};

const removeById = (arr, id) => {
    const targetIdx = arr.findIndex((a) => {
        return a.id === id;
    });
    // Should never happen
    if (targetIdx !== -1) {
        // Fine to mutate it.
        arr.splice(targetIdx, 1);
    }
};

export const sortWithTemporaryEvent = (events, temporaryEvent) => {
    const eventsCopy = events.concat();
    if (!temporaryEvent) {
        return sortEvents(eventsCopy);
    }

    // When dragging an event, remove the original event
    if (temporaryEvent.targetId) {
        removeById(eventsCopy, temporaryEvent.targetId);
    }

    if (!temporaryEvent.isAllDay) {
        return sortEvents([temporaryEvent, ...eventsCopy]);
    }

    // For all day events, push the event before any event that is overlapping
    const sortedEvents = sortEvents(eventsCopy);

    const idx = sortedEvents.findIndex((a) => {
        return a.end >= temporaryEvent.start;
    });

    sortedEvents.splice(idx === -1 ? sortedEvents.length : idx, 0, temporaryEvent);
    return sortedEvents;
};

export const getCollisionGroups = (events) => {
    let maxEnd = -1;
    let tmp = [];

    return events.reduce((acc, event, i, arr) => {
        const { start, end } = event;
        const isIntersect = start < maxEnd;

        // This event is intersecting with the current intersection group.
        if (isIntersect) {
            // The max length of this intersection group.
            maxEnd = Math.max(maxEnd, end);
            tmp.push(event);
        } else {
            // Push the previous intersection group to the result
            if (tmp.length) {
                acc.push(tmp);
            }

            maxEnd = event.end;
            tmp = [event];
        }

        // If it's the last event, push the last intersection group.
        if (arr.length - 1 === i) {
            acc.push(tmp);
        }

        return acc;
    }, []);
};

export const getColumns = (group) => {
    return group.reduce((columns, event, i) => {
        for (let j = 0; j < columns.length; ++j) {
            const column = columns[j];
            const isIntersect = event.start < column.end;

            if (!isIntersect) {
                column.indices.push(i);
                column.end = Math.max(column.end, event.end);
                return columns;
            }
        }

        columns.push({
            indices: [i],
            end: event.end
        });

        return columns;
    }, []);
};

export const layout = (events = []) => {
    const groups = getCollisionGroups(events);
    return groups.reduce((acc, group) => {
        const columns = getColumns(group);

        group.forEach((event, j) => {
            const columnIndex = columns.findIndex(({ indices }) => indices.indexOf(j) !== -1);
            acc.push({
                column: columnIndex,
                columns: columns.length
            });
        });

        return acc;
    }, []);
};
