import { useEffect, useState } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { CacheType } from '@proton/redux-utilities';
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
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getCalendarUserSettings = useGetCalendarUserSettings();

    const silentApi = useSilentApi();

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
            const [allCalendars] = await Promise.all([
                getCalendars({ cache: CacheType.None }),
                getCalendarUserSettings({ cache: CacheType.None }),
            ]);
            await Promise.all(allCalendars.map((calendar) => getCalendarBootstrap(calendar.ID, CacheType.None)));
        };
        run()
            .then(() => {
                onDone();
            })
            .catch((e) => {
                setError(e);
                traceError(e);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CB4D60
    }, []);

    if (error) {
        return <StandardLoadErrorPage />;
    }

    return <LoaderPage />;
};

export default CalendarSetupContainer;
