import { useEffect } from 'react';

import { serverEvent } from '@proton/account';
import { useDispatch } from '@proton/redux-shared-store';
import { HolidaysCalendarsModel } from '@proton/shared/lib/models';

import { useCache, useEventManager } from '../../hooks';

let cachedLocale;

const EventModelListener = () => {
    const { subscribe } = useEventManager();
    const cache = useCache();
    const dispatch = useDispatch();

    useEffect(() => {
        return subscribe((data) => {
            dispatch(serverEvent(data));

            /**
             * Before updating model values
             */
            if (data.UserSettings && cachedLocale !== data.UserSettings.Locale) {
                cachedLocale = data.UserSettings.Locale;
                // The directory of holidays calendars is fetched translated from back-end, so when the app language
                // is changed we need to clear the cache so that next time they're requested we fetch them in the new language
                cache.delete(HolidaysCalendarsModel.key);
            }
        });
    }, []);

    return null;
};

EventModelListener.propTypes = {};

export default EventModelListener;
