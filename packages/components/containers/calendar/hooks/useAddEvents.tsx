import { processInBatches } from '@proton/shared/lib/calendar/import/encryptAndSubmit';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { useCallback } from 'react';
import { useApi, useGetCalendarInfo } from '../../../hooks';

const useAddEvents = () => {
    const api = useApi();
    const getCalendarInfo = useGetCalendarInfo();

    return useCallback(async ({ calendarID, events }: { calendarID: string; events: VcalVeventComponent[] }) => {
        const { addressKeys, memberID, decryptedCalendarKeys } = await getCalendarInfo(calendarID);
        return processInBatches({
            events,
            api,
            memberID,
            addressKeys,
            calendarID,
            calendarKeys: decryptedCalendarKeys,
        });
    }, []);
};

export default useAddEvents;
