import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApi, EventManagerProvider, CacheProvider } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import { UserModel } from 'proton-shared/lib/models/userModel';
import { UserSettingsModel } from 'proton-shared/lib/models/userSettingsModel';
import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import { OrganizationModel } from 'proton-shared/lib/models/organizationModel';
import { setupEventManager, getEventID } from 'proton-shared/lib/models/setupEventManager';
import { STATUS } from 'proton-shared/lib/models/cache';

const ModelsProvider = ({ children, loginData = {} }) => {
    const api = useApi();
    const eventManagerRef = useRef();
    const cacheRef = useRef();

    const [{ loading, error }, setState] = useState({ loading: true });

    useEffect(() => {
        const abortController = new AbortController();
        const apiWithAbort = (config) => api({ ...config, signal: abortController.signal });

        const setup = async () => {
            const [user, eventID, userSettingsModel] = await Promise.all([
                loginData.user || UserModel.get(api),
                loginData.eventID || getEventID(api),
                UserSettingsModel.get(api)
            ]);

            const models = [user.isPaid && SubscriptionModel, user.isPaid && OrganizationModel].filter(Boolean);
            const modelsResult = await Promise.all(models.map(({ get }) => get(api)));

            const initialCache = {
                [UserModel.key]: user,
                [UserSettingsModel.key]: userSettingsModel,
                ...models.reduce((acc, cur, i) => {
                    acc[cur.key] = modelsResult[i];
                    return acc;
                }, {})
            };

            const cache = createCache();
            // TODO: Remove after test
            window.cache = cache;

            Object.keys(initialCache).forEach((key) => {
                cache.set(key, {
                    value: initialCache[key],
                    status: STATUS.RESOLVED
                });
            });

            const eventManager = setupEventManager(cache, eventID, api);

            cacheRef.current = cache;
            eventManagerRef.current = eventManager;
        };

        setup(apiWithAbort)
            .then(() => {
                setState({ loading: false });
            })
            .catch((e) => {
                // eslint-disable-next-line
                console.error(e);
                setState({ loading: false, error: e });
            });

        return () => {
            abortController.abort();
        };
    }, []);

    if (loading) {
        return 'Loading...';
    }

    if (error) {
        return `Error ${error.toString()}`;
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <CacheProvider cache={cacheRef.current}>{children}</CacheProvider>
        </EventManagerProvider>
    );
};

ModelsProvider.propTypes = {
    children: PropTypes.node.isRequired,
    loginData: PropTypes.object
};

export default ModelsProvider;
