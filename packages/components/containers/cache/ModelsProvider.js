import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApi, EventManagerProvider, CacheProvider, PromiseCacheProvider } from 'react-components';
import createCache from 'proton-shared/lib/state/state';
import { setupCatche, setupEventManager } from 'proton-shared/lib/models/init';

const ModelsProvider = ({ children, init }) => {
    const api = useApi();
    const eventManagerRef = useRef();
    const cacheRef = useRef();
    const promiseCacheRef = useRef();

    const [{ loading, error }, setState] = useState({ loading: true });

    useEffect(() => {
        const abortController = new AbortController();
        const apiWithAbort = (config) => api({ ...config, signal: abortController.signal });

        const setup = async () => {
            const [user, eventID] = await init(api);

            const cache = await setupCatche(user, api);
            const eventManager = setupEventManager(cache, eventID, api);

            cacheRef.current = cache;
            eventManagerRef.current = eventManager;
            promiseCacheRef.current = createCache({});
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
            <CacheProvider cache={cacheRef.current}>
                <PromiseCacheProvider cache={promiseCacheRef.current}>{children}</PromiseCacheProvider>
            </CacheProvider>
        </EventManagerProvider>
    );
};

ModelsProvider.propTypes = {
    children: PropTypes.node.isRequired,
    init: PropTypes.func.isRequired
};

export default ModelsProvider;
