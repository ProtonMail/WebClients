import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import useApiStatus from '@proton/components/hooks/useApiStatus';
import useOnline from '@proton/components/hooks/useOnline';
import { SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { CalendarsEventsCache } from './interface';

const countToTimeout: Partial<Record<number, number>> = {
    0: 0.5,
    1: 1,
    2: 2,
    3: 4,
    4: 8,
};

export type InitRetry = (calendarID: string, eventID: string, resetCount?: boolean) => Promise<boolean>;

const getEventKey = (calendarID: string, eventID: string) => {
    return `${calendarID}.${eventID}`;
};

const deserializeEventKey = (serializedId: string) => {
    return serializedId.split('.');
};

const useCalendarsEventsRetry = ({
    calendarsEventsCacheRef,
}: {
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}) => {
    const { offline } = useApiStatus();
    const onlineStatus = useOnline();
    const safeIsOnlineValue = onlineStatus && !offline;
    const safeIsOnlineRef = useRef(safeIsOnlineValue);

    const eventsRetryMap = useRef(new Map<string, number>());

    const initRetry: InitRetry = async (calendarID, eventID, resetCount) => {
        const eventKey = getEventKey(calendarID, eventID);
        if (resetCount || !eventsRetryMap.current.has(eventKey)) {
            eventsRetryMap.current.set(eventKey, 0);
        }
        const previousCount = eventsRetryMap.current.get(eventKey);

        const count = previousCount ?? 0;

        if (count >= 5) {
            return false;
        }

        await wait((countToTimeout[count] ?? 0) * SECOND);
        if (!safeIsOnlineRef.current) {
            return false;
        }

        eventsRetryMap.current.set(eventKey, count + 1);
        const result = await calendarsEventsCacheRef.current.retryReadEvent(calendarID, eventID);

        if (result?.error) {
            return initRetry(calendarID, eventID);
        }

        /**
         * Remove key on success
         */
        eventsRetryMap.current.delete(eventKey);

        return true;
    };

    useEffect(() => {
        safeIsOnlineRef.current = safeIsOnlineValue;
        if (safeIsOnlineValue) {
            /**
             * When we go back online, then we want to restart retries
             */
            [...eventsRetryMap.current.keys()].forEach((key) => {
                const [calendarID, eventID] = deserializeEventKey(key);
                void initRetry(calendarID, eventID, true);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-4A7D7F
    }, [safeIsOnlineValue]);

    return { initRetry };
};

export default useCalendarsEventsRetry;
