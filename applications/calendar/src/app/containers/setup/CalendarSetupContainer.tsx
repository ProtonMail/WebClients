import React, { useState, useEffect } from 'react';
import {
    LoaderPage,
    StandardLoadErrorPage,
    useApi,
    useCache,
    useEventManager,
    useGetAddresses,
    useGetAddressKeys,
} from '@proton/components';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { CalendarsModel, CalendarUserSettingsModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';

import { setupCalendarKeys } from '@proton/components/containers/keys/calendar';
import setupCalendarHelper from './reset/setupCalendarHelper';

interface Props {
    onDone: () => void;
    calendars?: Calendar[];
}
const CalendarSetupContainer = ({ onDone, calendars }: Props) => {
    const { call } = useEventManager();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const [error, setError] = useState();

    useEffect(() => {
        const run = async () => {
            const addresses = await getAddresses();

            if (calendars) {
                await setupCalendarKeys({
                    api: silentApi,
                    calendars,
                    getAddressKeys,
                    addresses,
                });
            } else {
                await setupCalendarHelper({
                    api: silentApi,
                    addresses,
                    getAddressKeys,
                });
            }

            await call();
            await loadModels([CalendarsModel, CalendarUserSettingsModel], { api: silentApi, cache, useCache: false });
        };
        run()
            .then(() => {
                onDone();
            })
            .catch((e) => {
                setError(e);
                traceError(e);
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage />;
    }

    return <LoaderPage />;
};

export default CalendarSetupContainer;
