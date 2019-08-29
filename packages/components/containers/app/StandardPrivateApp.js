import React, { useState, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import {
    EventManagerProvider,
    ForceRefreshProvider,
    Loader,
    ModalsChildren,
    ThemeInjector,
    LocaleInjector,
    useApi,
    useCache
} from 'react-components';
import { UserModel, UserSettingsModel } from 'proton-shared/lib/models';

import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { loadModels } from 'proton-shared/lib/models/helper';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { loadLocale } from 'proton-shared/lib/i18n';
import { uniqueBy } from 'proton-shared/lib/helpers/array';
import { getLatestID } from 'proton-shared/lib/api/events';

import ModelListener from '../eventManager/ModelListener';
import EventNotices from '../eventManager/EventNotices';

const getEventID = ({ cache, api }) => {
    // Set from <ProtonApp/> on login.
    const { eventID: tmpEventID } = cache.get('tmp') || {};
    cache.set('tmp', undefined);
    return Promise.resolve(tmpEventID || api(getLatestID()).then(({ EventID }) => EventID));
};

const Preload = ({ locales = {}, preloadModels = [], onSuccess, onError }) => {
    const api = useApi();
    const cache = useCache();

    useLayoutEffect(() => {
        (async () => {
            const [[userSettings], eventID] = await Promise.all([
                loadModels(uniqueBy([UserSettingsModel, UserModel, ...preloadModels], (x) => x), { api, cache }),
                getEventID({ api, cache }),
                loadOpenPGP()
            ]);
            await loadLocale(userSettings.Locale, locales);
            return createEventManager({ api, eventID });
        })()
            .then(onSuccess)
            .catch(onError);
    }, []);

    return null;
};

const StandardPrivateApp = ({ onLogout, locales = {}, preloadModels = [], eventModels = [], children }) => {
    const [loading, setLoading] = useState(true);
    const eventManagerRef = useRef();
    const refreshRef = useRef();

    if (loading) {
        return (
            <>
                <Preload
                    eventModels={eventModels}
                    preloadModels={preloadModels}
                    locales={locales}
                    onSuccess={(ev) => {
                        eventManagerRef.current = ev;
                        setLoading(false);
                    }}
                    onError={onLogout}
                />
                <ModalsChildren />
                <Loader />
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <ModelListener models={eventModels} />
            <EventNotices />
            <ThemeInjector />
            <LocaleInjector locales={locales} refresh={refreshRef} />
            <ForceRefreshProvider ref={refreshRef}>
                <ModalsChildren />
                {children}
            </ForceRefreshProvider>
        </EventManagerProvider>
    );
};

StandardPrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    locales: PropTypes.object,
    preloadModels: PropTypes.array,
    eventModels: PropTypes.array
};

export default StandardPrivateApp;
