import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { useGetCalendarInfo } from '@proton/components/hooks/useGetCalendarInfo';
import { processInBatches } from '@proton/shared/lib/calendar/import/encryptAndSubmit';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

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
