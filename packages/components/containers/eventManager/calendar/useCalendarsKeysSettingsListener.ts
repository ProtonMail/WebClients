import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { CalendarsModel, CalendarUserSettingsModel } from 'proton-shared/lib/models';
import { useEffect } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';
import { CalendarEventManager } from 'proton-shared/lib/interfaces/calendar/EventManager';
import { updateObject as updateCalendarObject } from 'proton-shared/lib/models/calendarBootstrap';
import { useCache, useEventManager } from '../../../hooks';
import { KEY as CALENDAR_BOOTSTRAP_CACHE } from '../../../hooks/useGetCalendarBootstrap';
import { CACHE_KEY as CALENDAR_KEYS_CACHE } from '../../../hooks/useGetDecryptedPassphraseAndCalendarKeys';
import { useCalendarModelEventManager } from './ModelEventManagerProvider';

const useCalendarsKeysSettingsListener = (calendarIDs: string[]) => {
    const { subscribe: standardSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe, reset: calendarReset } = useCalendarModelEventManager();
    const cache = useCache();

    useEffect(() => {
        // subscribe via the calendar event loop to CalendarKeysModel and CalendarSettingsModel
        return calendarSubscribe(calendarIDs, (data) => {
            if (data) {
                updateCalendarObject(data, cache.get(CALENDAR_BOOTSTRAP_CACHE), cache.get(CALENDAR_KEYS_CACHE));
            }
        });
    }, [calendarIDs]);

    useEffect(() => {
        // subscribe via the standard event loop to CalendarsModel and CalendarUserSettingsModel
        const modelsMap = {
            [CalendarsModel.key]: CalendarsModel,
            [CalendarUserSettingsModel.key]: CalendarUserSettingsModel,
        };
        return standardSubscribe((data) => {
            for (const key of Object.keys(data)) {
                const model = modelsMap[key];
                if (!model) {
                    continue;
                }
                const { value: oldValue, status } = cache.get(key) || {};
                if (status === STATUS.RESOLVED) {
                    cache.set(key, {
                        status: STATUS.RESOLVED,
                        value: model.update(oldValue, data[key]),
                    });
                }
            }
        });
    }, []);

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

export default useCalendarsKeysSettingsListener;
