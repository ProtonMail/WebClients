export const getCollisionGroups = (events: LayoutEvent[]) => {
    let maxEnd = -1;
    let tmp: LayoutEvent[] = [];

    return events.reduce<LayoutEvent[][]>((acc, event, i, arr) => {
        const { start, end } = event;
        const isIntersect = +start < maxEnd;

        // This event is intersecting with the current intersection group.
        if (isIntersect) {
            // The max length of this intersection group.
            maxEnd = Math.max(maxEnd, +end);
            tmp.push(event);
        } else {
            // Push the previous intersection group to the result
            if (tmp.length) {
                acc.push(tmp);
            }

            maxEnd = +event.end;
            tmp = [event];
        }

        // If it's the last event, push the last intersection group.
        if (arr.length - 1 === i) {
            acc.push(tmp);
        }

        return acc;
    }, []);
};

interface ColumnsResult {
    indices: number[];
    end: number;
}
export const getColumns = (group: LayoutEvent[]) => {
    return group.reduce<ColumnsResult[]>((columns, event, i) => {
        for (let j = 0; j < columns.length; ++j) {
            const column = columns[j];
            const isIntersect = +event.start < +column.end;

            if (!isIntersect) {
                column.indices.push(i);
                column.end = Math.max(column.end, +event.end);
                return columns;
            }
        }

        columns.push({
            indices: [i],
            end: event.end,
        });

        return columns;
    }, []);
};

export interface LayoutEvent {
    idx: number;
    start: number;
    end: number;
}
export interface LayoutResult {
    column: number;
    columns: number;
}

export const layout = (events: LayoutEvent[] = []) => {
    const groups = getCollisionGroups(events);
    return groups.reduce<LayoutResult[]>((acc, group) => {
        const columns = getColumns(group);

        group.forEach((event, j) => {
            const columnIndex = columns.findIndex(({ indices }) => indices.indexOf(j) !== -1);
            acc.push({
                column: columnIndex,
                columns: columns.length,
            });
        });

        return acc;
    }, []);
};
