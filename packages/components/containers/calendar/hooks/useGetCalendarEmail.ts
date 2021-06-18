import { useEffect, useState } from 'react';
import { SimpleMap } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

import { useGetCalendarBootstrap } from '../../../hooks';

const useGetCalendarEmail = (calendars: Calendar[]) => {
    const getCalendarBootstrap = useGetCalendarBootstrap();

    const [calendarAddressMap, setCalendarAddressMap] = useState<SimpleMap<string>>({});

    useEffect(() => {
        (async () => {
            const calendarEmailTuple = await Promise.all(
                calendars.map(async ({ ID }) => {
                    const { Members } = await getCalendarBootstrap(ID);
                    const [{ Email = '' }] = Members;

                    return [ID, Email];
                })
            );
            const calendarEmailMap = calendarEmailTuple.reduce<SimpleMap<string>>((acc, [calendarID, email]) => {
                acc[calendarID] = email;

                return acc;
            }, {});

            setCalendarAddressMap(calendarEmailMap);
        })();
    }, []);

    return calendarAddressMap;
};

export default useGetCalendarEmail;
