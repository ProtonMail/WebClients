import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { CalendarUserSettingsModel } from '@proton/shared/lib/models';
import { useEffect } from 'react';
import { STATUS } from '@proton/shared/lib/models/cache';
import { CalendarEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';
import { updateCalendarsWithMembers as updateCalendarsWithMembers } from '@proton/shared/lib/models/calendarMembers';
import { updateBootstrapKeysAndSettings, updateBootstrapMembers } from '@proton/shared/lib/models/calendarBootstrap';
import { useCache, useEventManager } from '../../../hooks';
import { KEY as CALENDAR_BOOTSTRAP_CACHE } from '../../../hooks/useGetCalendarBootstrap';
import { CACHE_KEY as CALENDAR_KEYS_CACHE } from '../../../hooks/useGetDecryptedPassphraseAndCalendarKeys';
import { useCalendarModelEventManager } from './ModelEventManagerProvider';

/**
 * Listen manually to updates to calendar members and user settings (via core event loop)
 */
export const useCalendarsInfoCoreListener = () => {
    const { subscribe: standardSubscribe } = useEventManager();
    const cache = useCache();

    useEffect(() => {
        // subscribe via the standard event loop to updates of CalendarsModel, CalendarMembersModel and CalendarUserSettingsModel
        const calendarUserSettingsModelKey = CalendarUserSettingsModel.key;
        return standardSubscribe((data) => {
            if (data[calendarUserSettingsModelKey]) {
                const { value: oldValue, status } = cache.get(calendarUserSettingsModelKey) || {};
                if (status === STATUS.RESOLVED) {
                    cache.set(calendarUserSettingsModelKey, {
                        status: STATUS.RESOLVED,
                        value: CalendarUserSettingsModel.update(oldValue, data[calendarUserSettingsModelKey]),
                    });
                }
            }
            updateCalendarsWithMembers(cache, data);
            updateBootstrapMembers(cache.get(CALENDAR_BOOTSTRAP_CACHE), data);
        });
    }, []);
};

const useCalendarsInfoCalendarListener = (calendarIDs: string[]) => {
    const { subscribe: standardSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe, reset: calendarReset } = useCalendarModelEventManager();
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
    }, [calendarIDs]);

    useEffect(() => {
        // stop per-calendar event managers when calendars are deleted
        return standardSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
            Calendars.forEach(({ ID, Action }) => {
                if (Action === EVENT_ACTIONS.DELETE) {
                    calendarReset([ID]);
                }
            });
        });
    }, []);
};

/**
 * Listen manually to updates to calendar members, keys and settings
 */
const useCalendarsInfoListener = (calendarIDs: string[]) => {
    useCalendarsInfoCoreListener();
    useCalendarsInfoCalendarListener(calendarIDs);
};

export default useCalendarsInfoListener;
