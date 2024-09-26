import { useEffect, useState } from 'react';

import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import {
    LoaderPage,
    StandardLoadErrorPage,
    useApi,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetCalendars,
} from '@proton/components';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import setupCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupCalendarHelper';
import { setupCalendarKeys } from '@proton/shared/lib/calendar/crypto/keys/setupCalendarKeys';
import setupHolidaysCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupHolidaysCalendarHelper';
import { getSuggestedHolidaysCalendar } from '@proton/shared/lib/calendar/holidaysCalendar/holidaysCalendar';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { languageCode } from '@proton/shared/lib/i18n';
import { getBrowserLanguageTags } from '@proton/shared/lib/i18n/helper';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

interface Props {
    hasCalendarToGenerate?: boolean;
    hasHolidaysCalendarToGenerate?: boolean;
    calendars?: VisualCalendar[];
    onDone: () => void;
}

const CalendarSetupContainer = ({ hasCalendarToGenerate, hasHolidaysCalendarToGenerate, calendars, onDone }: Props) => {
    const { call } = useEventManager();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getHolidaysDirectory = useGetHolidaysDirectory();
    const getCalendars = useGetCalendars();
    const getCalendarUserSettings = useGetCalendarUserSettings();

    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);

    const [error, setError] = useState();

    useEffect(() => {
        const run = async () => {
            const addresses = await getAddresses();

            if (calendars) {
                await setupCalendarKeys({
                    api: silentApi,
                    calendars,
                    getAddressKeys,
                });
            } else {
                const promises = [];
                if (hasCalendarToGenerate) {
                    // we create a personal calendar
                    promises.push(
                        setupCalendarHelper({
                            api: silentApi,
                            addresses,
                            getAddressKeys,
                        })
                    );
                }
                if (hasHolidaysCalendarToGenerate) {
                    // we create a public holidays calendar. If we fail, we do it silently
                    try {
                        const directory = await getHolidaysDirectory();
                        const visibleDirectory = directory.filter(({ Hidden }) => !Hidden);
                        const languageTags = getBrowserLanguageTags();
                        const holidaysCalendar = getSuggestedHolidaysCalendar(
                            visibleDirectory,
                            getTimezone(),
                            languageCode,
                            languageTags
                        );
                        if (!holidaysCalendar) {
                            throw new Error('Skip creating holidays calendar');
                        }
                        promises.push(
                            setupHolidaysCalendarHelper({
                                holidaysCalendar,
                                color: getRandomAccentColor(),
                                notifications: [],
                                addresses,
                                getAddressKeys,
                                api: silentApi,
                            }).catch(noop)
                        );
                    } catch (e) {
                        noop();
                    }
                }
                await Promise.all(promises);
            }

            await call();
            await Promise.all([
                getCalendars({ cache: CacheType.None }),
                getCalendarUserSettings({ cache: CacheType.None }),
            ]);
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
