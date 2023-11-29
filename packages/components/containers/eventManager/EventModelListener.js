import { useEffect } from 'react';

import PropTypes from 'prop-types';

import { serverEvent } from '@proton/account';
import { useDispatch } from '@proton/redux-shared-store';
import { HolidaysCalendarsModel } from '@proton/shared/lib/models';
import { STATUS } from '@proton/shared/lib/models/cache';

import { useCache, useEventManager } from '../../hooks';

let cachedLocale;

const EventModelListener = ({ models = [] }) => {
    const { subscribe } = useEventManager();
    const cache = useCache();
    const dispatch = useDispatch();

    useEffect(() => {
        const modelsMap = models.reduce((acc, model) => {
            return {
                ...acc,
                [model.key]: model,
            };
        }, {});

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

            /**
             * Update model values
             */
            if (models?.length) {
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
            }
        });
    }, []);

    return null;
};

EventModelListener.propTypes = {
    models: PropTypes.array.isRequired,
};

export default EventModelListener;
