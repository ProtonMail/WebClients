import { useEffect, useReducer } from 'react';
import { SimpleMap } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

import { useGetCalendarBootstrap } from '../../../hooks';

const reducer = (oldState: SimpleMap<string>, tuples: string[][]) => {
    const newTuples = tuples.filter(([ID, email]) => {
        return oldState[ID] !== email;
    });
    if (!newTuples.length) {
        return oldState;
    }
    return newTuples.reduce(
        (acc, [ID, email]) => {
            acc[ID] = email;
            return acc;
        },
        { ...oldState }
    );
};

const useGetCalendarsEmails = (calendars: Calendar[]) => {
    const getCalendarBootstrap = useGetCalendarBootstrap();

    const [calendarsEmailsMap, updateCalendarsEmailsMap] = useReducer(reducer, {});

    useEffect(() => {
        (async () => {
            const calendarsEmailsTuples = await Promise.all(
                calendars.map(async ({ ID }) => {
                    const { Members } = await getCalendarBootstrap(ID);
                    const [{ Email = '' }] = Members;
                    return [ID, Email];
                })
            );
            updateCalendarsEmailsMap(calendarsEmailsTuples);
        })();
    }, [calendars]);

    return calendarsEmailsMap;
};

export default useGetCalendarsEmails;
