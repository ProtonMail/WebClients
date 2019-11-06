import { useEffect } from 'react';
import { useApi, useCache } from 'react-components';
import { loadModels } from 'proton-shared/lib/models/helper';
import { getEventID } from 'react-components/containers/app/StandardPreload';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { uniqueBy } from 'proton-shared/lib/helpers/array';
import loadLocale from 'proton-shared/lib/i18n/loadLocale';
import updateLongLocale from 'proton-shared/lib/i18n/updateLongLocale';
import { CalendarsModel, CalendarUserSettingsModel, UserModel, UserSettingsModel } from 'proton-shared/lib/models';
import { getBrowserLocale, getClosestMatches } from 'proton-shared/lib/i18n/helper';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { SETTINGS_TIME_FORMAT } from '../constants';

const CalendarPreload = ({ locales = {}, preloadModels = [], onSuccess, onError }) => {
    const api = useApi();
    const cache = useCache();

    useEffect(() => {
        (async () => {
            const [[userSettings, calendars], eventID] = await Promise.all([
                loadModels(uniqueBy([UserSettingsModel, CalendarsModel, UserModel, ...preloadModels], (x) => x), {
                    api,
                    cache
                }),
                getEventID({ api, cache }),
                loadOpenPGP()
            ]);

            await loadLocale({
                ...getClosestMatches({
                    locale: userSettings.Locale,
                    browserLocale: getBrowserLocale(),
                    locales
                }),
                locales
            });

            if (calendars && calendars.length) {
                // The calendar settings can only be fetched if calendars have been setup.
                const [{ TimeFormat }] = await loadModels([CalendarUserSettingsModel], { api, cache });
                updateLongLocale({ displayAMPM: TimeFormat === SETTINGS_TIME_FORMAT.H12 });
            }

            return createEventManager({ api, eventID });
        })()
            .then(onSuccess)
            .catch(onError);
    }, []);

    return null;
};

export default CalendarPreload;
