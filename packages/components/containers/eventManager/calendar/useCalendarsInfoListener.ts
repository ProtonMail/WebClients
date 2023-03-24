import { useEffect } from 'react';

import {
    updateBootstrapKeysAndSettings,
    updateBootstrapMembers,
} from '@proton/shared/lib/eventManager/calendar/calendarBootstrap';
import { updateCalendarsUserSettings } from '@proton/shared/lib/eventManager/calendar/calendarUserSettings';
import { updateCalendarsWithMembers } from '@proton/shared/lib/eventManager/calendar/calendarsWithMembers';

import { useAddresses, useCache, useEventManager } from '../../../hooks';
import { KEY as CALENDAR_BOOTSTRAP_CACHE } from '../../../hooks/useGetCalendarBootstrap';
import { CACHE_KEY as CALENDAR_KEYS_CACHE } from '../../../hooks/useGetDecryptedPassphraseAndCalendarKeys';
import { useCalendarModelEventManager } from './ModelEventManagerProvider';

/**
 * Listen to updates to calendars, calendar members and calendar user settings (via core event loop)
 */
export const useCalendarsInfoCoreListener = () => {
    const { subscribe: coreSubscribe } = useEventManager();
    const { reset: calendarReset } = useCalendarModelEventManager();
    const cache = useCache();
    const [addresses] = useAddresses();

    useEffect(() => {
        // subscribe via the standard event loop to updates of CalendarsModel, CalendarMembersModel and CalendarUserSettingsModel
        const ownAddressIDs = (addresses || []).map(({ ID }) => ID);

        return coreSubscribe((data) => {
            updateCalendarsUserSettings(cache, data);
            updateCalendarsWithMembers(cache, data, ownAddressIDs, calendarReset);
            updateBootstrapMembers(cache.get(CALENDAR_BOOTSTRAP_CACHE), data);
        });
    }, [cache, addresses]);
};

/**
 * Listen to updates to calendar keys and settings (via calendar event loop)
 */
const useCalendarsInfoCalendarListener = (calendarIDs: string[]) => {
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();
    const cache = useCache();

    useEffect(() => {
        // subscribe via the calendar event loop to updates of CalendarKeysModel and CalendarSettingsModel
        return calendarSubscribe(calendarIDs, (data) => {
            if (data) {
                updateBootstrapKeysAndSettings(
                    data,
                    cache.get(CALENDAR_BOOTSTRAP_CACHE),
                    cache.get(CALENDAR_KEYS_CACHE)
                );
            }
        });
    }, [cache, calendarIDs]);
};

export const useCalendarsInfoListener = (calendarIDs: string[]) => {
    useCalendarsInfoCoreListener();
    useCalendarsInfoCalendarListener(calendarIDs);
};

export default useCalendarsInfoListener;
