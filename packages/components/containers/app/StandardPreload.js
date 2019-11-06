import { useEffect } from 'react';
import { useApi, useCache } from 'react-components';
import { loadModels } from 'proton-shared/lib/models/helper';
import { uniqueBy } from 'proton-shared/lib/helpers/array';
import { UserModel, UserSettingsModel } from 'proton-shared/lib/models';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import loadLocale from 'proton-shared/lib/i18n/loadLocale';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { getBrowserLocale, getClosestMatches } from 'proton-shared/lib/i18n/helper';
import { getLatestID } from 'proton-shared/lib/api/events';

export const getEventID = ({ cache, api }) => {
    // Set from <ProtonApp/> on login.
    const { eventID: tmpEventID } = cache.get('tmp') || {};
    cache.set('tmp', undefined);
    return Promise.resolve(tmpEventID || api(getLatestID()).then(({ EventID }) => EventID));
};

const StandardPreload = ({ locales = {}, preloadModels = [], onSuccess, onError }) => {
    const api = useApi();
    const cache = useCache();

    useEffect(() => {
        (async () => {
            const [[userSettings], eventID] = await Promise.all([
                loadModels(uniqueBy([UserSettingsModel, UserModel, ...preloadModels], (x) => x), { api, cache }),
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

            return createEventManager({ api, eventID });
        })()
            .then(onSuccess)
            .catch(onError);
    }, []);

    return null;
};

export default StandardPreload;
