import { useEffect } from 'react';

import { differenceInHours } from 'date-fns';

import { useApi } from '@proton/components';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

const badgePing = () => ({
    url: 'tests/ping?categoryBadge',
    method: 'get',
});

const CATEGORY_TIME_PING = 'CATEGORY_TIME_PING';

/**
 * We had an issue with a Unleash feature flag where some strategies would show for some users.
 * The strategy configuration should have prevented that but it didn't work as expected.
 *
 * We decided to add a ping in the category badge to know as soon as someone sees the category badge.
 * This allows us to make sure the feature is only visible to users who should see it and change the flag otherwise.
 *
 * The data is stored in sessionStorage as we don't need to keep it around forever.
 */
export const useCategoryPing = () => {
    const api = useApi();
    const silentApi = getSilentApi(api);

    useEffect(() => {
        const lastPing = getItem(CATEGORY_TIME_PING);
        if (!lastPing) {
            void silentApi(badgePing());
            setItem(CATEGORY_TIME_PING, new Date().toISOString());
        }

        const lastPingDate = new Date(lastPing as string);
        console.log(lastPingDate, { cond: differenceInHours(lastPingDate, new Date()) });
        if (differenceInHours(lastPingDate, new Date()) > 1) {
            void silentApi(badgePing());
            setItem(CATEGORY_TIME_PING, new Date().toISOString());
        }
    }, []);
};
