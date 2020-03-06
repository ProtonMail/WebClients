import React, { useState, useRef, useEffect } from 'react';
import { EventManagerProvider, ModalsChildren, ThemeInjector } from '../../index';
import { UserModel, UserSettingsModel } from 'proton-shared/lib/models';
import { unique } from 'proton-shared/lib/helpers/array';
import loadLocale from 'proton-shared/lib/i18n/loadLocale';
import { getClosestMatches, getBrowserLocale } from 'proton-shared/lib/i18n/helper';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { loadModels } from 'proton-shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from 'proton-shared/lib/openpgp';
import { noop } from 'proton-shared/lib/helpers/function';

import EventModelListener from '../eventManager/EventModelListener';
import EventNotices from '../eventManager/EventNotices';
import LoaderPage from './LoaderPage';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { useApi, useCache } from '../../index';
import loadEventID from './loadEventID';

const StandardPrivateApp = ({
    locales = {},
    onLogout,
    onInit = noop,
    fallback,
    openpgpConfig,
    preloadModels = [],
    eventModels = [],
    children
}) => {
    const [loading, setLoading] = useState(true);
    const eventManagerRef = useRef();
    const api = useApi();
    const cache = useCache();

    useEffect(() => {
        const eventManagerPromise = loadEventID(api, cache).then((eventID) => {
            eventManagerRef.current = createEventManager({ api, eventID });
        });

        const modelsPromise = loadModels(unique([UserSettingsModel, UserModel, ...preloadModels]), { api, cache })
            .then(([userSettings]) => {
                return loadLocale({
                    ...getClosestMatches({ locale: userSettings.Locale, browserLocale: getBrowserLocale(), locales }),
                    locales
                });
            })
            .then(() => onInit()); // onInit has to happen after locales have been loaded to allow applications to override it

        Promise.all([eventManagerPromise, modelsPromise, loadOpenPGP(openpgpConfig)])
            .then(() => {
                setLoading(false);
            })
            .catch(() => {
                onLogout();
            });

        return () => {
            destroyOpenPGP();
        };
    }, []);

    if (loading) {
        return (
            <>
                <ModalsChildren />
                {fallback || <LoaderPage />}
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <EventModelListener models={eventModels} />
            <EventNotices />
            <ThemeInjector />
            <ModalsChildren />
            <ForceRefreshProvider>{children}</ForceRefreshProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
