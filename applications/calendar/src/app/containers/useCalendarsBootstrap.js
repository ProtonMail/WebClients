import { useEffect, useRef, useState } from 'react';
import { useApi, useEventManager, useInstance } from 'react-components';
import { getFullCalendar } from 'proton-shared/lib/api/calendars';

const getResult = (cache, calendars) => {
    return calendars.reduce((acc, { ID }) => {
        acc[ID] = cache.get(ID);
        return acc;
    }, {});
};

const useCalendarsBootstrap = (calendars) => {
    const [state, setState] = useState(() => [undefined, false, undefined]);
    const currentRef = useRef(0);
    const api = useApi();
    const eventManager = useEventManager();
    const cache = useInstance(() => new Map());

    useEffect(() => {
        return eventManager.subscribe(() => {
            // TODO
            // - update cache if calendar exists
            // - setResult(getResult(cache, calendars));
        });
    }, []);

    useEffect(() => {
        const current = currentRef.current + 1;
        currentRef.current = current;

        if (!Array.isArray(calendars)) {
            setState([undefined, false, undefined]);
            return;
        }

        setState([state[0], false, state[2]]);

        Promise.all(
            calendars.map(({ ID }) => {
                if (cache.has(ID)) {
                    return;
                }
                return api(getFullCalendar(ID)).then((calendar) => {
                    if (currentRef.current !== current) {
                        return;
                    }
                    const modifiedCalendar = {
                        ...calendar,
                        Passphrase: undefined,
                        Passphrases: [calendar.Passphrase]
                    };
                    cache.set(ID, modifiedCalendar);
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
    }, [calendars]);

    return state;
};

export default useCalendarsBootstrap;
