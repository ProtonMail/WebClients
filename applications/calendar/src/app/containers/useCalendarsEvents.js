import { useRef, useEffect, useState } from 'react';
import { useApi, useInstance } from 'react-components';
import { queryEvents } from 'proton-shared/lib/api/calendars';
import { millisecondsToSeconds } from '../helpers/time';

const getResult = (cache, calendars) => {
    return calendars.reduce((acc, { ID }) => {
        const value = cache.get(ID);
        acc[ID] = value ? value.result : undefined;
        return acc;
    }, {});
};

const getPaginatedEvents = async (api, calendarID, dateRange) => {
    let results = [];
    let lastEventID;

    const PageSize = 100;

    const params = {
        Start: millisecondsToSeconds(dateRange[0].getTime()),
        End: millisecondsToSeconds(dateRange[1].getTime()),
        PageSize
    };

    do {
        const { Events } = await api(queryEvents(calendarID, { ...params, PageStart: lastEventID }));
        results = results.concat(Events);
        lastEventID = Events.length === PageSize ? Events[Events.length - 1].ID : undefined;
    } while (lastEventID);

    return results;
};

const useCalendarsEvents = (calendars, dateRange) => {
    const [state, setState] = useState(() => [false, undefined, undefined]);
    const currentRef = useRef(0);
    const cache = useInstance(() => new Map());
    const api = useApi();

    useEffect(() => {
        if (!calendars || !dateRange) {
            setState([undefined, false, undefined]);
            return;
        }

        setState([state[0], true, state[2]]);

        const current = currentRef.current + 1;
        currentRef.current = current;

        Promise.all(
            calendars.map(({ ID }) => {
                const old = cache.get(ID);
                if (old && old.dateRange === dateRange) {
                    return;
                }
                return getPaginatedEvents(api, ID, dateRange).then((events) => {
                    if (currentRef.current !== current) {
                        return;
                    }
                    cache.set(ID, { result: events, dateRange });
                });
            })
        )
            .then(() => {
                if (currentRef.current !== current) {
                    return;
                }
                setState([getResult(cache, calendars), false, undefined]);
            })
            .catch((e) => {
                setState([undefined, false, e]);
            });
    }, [calendars, dateRange]);

    return state;
};

export default useCalendarsEvents;
