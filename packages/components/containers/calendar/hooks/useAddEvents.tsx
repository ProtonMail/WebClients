import { useCallback } from 'react';

import { processInBatches } from '@proton/shared/lib/calendar/import/encryptAndSubmit';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { useApi, useGetCalendarInfo } from '../../../hooks';

const useAddEvents = () => {
    const api = useApi();
    const getCalendarInfo = useGetCalendarInfo();

    return useCallback(
        async ({
            calendarID,
            events,
        }: {
            calendarID: string;
            events: { eventComponent: VcalVeventComponent; hasDefaultNotifications: boolean }[];
        }) => {
            const { addressKeys, memberID, calendarKeys } = await getCalendarInfo(calendarID);
            return processInBatches({
                events,
                api,
                memberID,
                addressKeys,
                calendarID,
                calendarKeys,
            });
        },
        []
    );
};

export default useAddEvents;
