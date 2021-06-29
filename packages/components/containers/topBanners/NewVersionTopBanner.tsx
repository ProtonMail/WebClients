import React, { useState, useEffect } from 'react';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { useConfig } from '../../hooks';
import NewVersionTopBannerView from './NewVersionTopBannerView';
import useApiStatus from '../../hooks/useApiStatus';

const EVERY_THIRTY_MINUTES = 30 * 60 * 1000;
const isDifferent = (a?: string, b?: string) => !!a && !!b && b !== a;

const NewVersionTopBanner = () => {
    const { VERSION_PATH, COMMIT } = useConfig();
    const [newVersionAvailable, setNewVersionAvailable] = useState(false);
    const { appVersionBad } = useApiStatus();

    const isNewVersionAvailable = async () => {
        try {
            const { commit } = await fetch(VERSION_PATH).then((response) => response.json());
            setNewVersionAvailable(isDifferent(commit, COMMIT));
        } catch (error) {
            traceError(error);
        }
    };

    useEffect(() => {
        isNewVersionAvailable();
        const intervalID = setInterval(() => {
            isNewVersionAvailable();
        }, EVERY_THIRTY_MINUTES);
        return () => clearInterval(intervalID);
    }, []);

    if (!newVersionAvailable && !appVersionBad) {
        return null;
    }

    return <NewVersionTopBannerView isError={appVersionBad} />;
};

export default NewVersionTopBanner;
