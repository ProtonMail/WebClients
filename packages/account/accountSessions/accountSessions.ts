import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    type ActiveSessionLite,
    getActiveSessionsData,
} from '@proton/shared/lib/authentication/persistedSessionHelper';

import { readAccountSessions } from './storage';

export const getLocalIDSessionString = (array: number[]) => {
    return array.sort().join(',');
};

/**
 * The way this works is that Account is setting a cookie on the base domain that contains the
 * currently active local ids. Each subdomain fetches `auth/v4/sessions/local` to have more information
 * about each session. The reason the `auth/v4/sessions/local` response cannot be used in isolation
 * is that it may contain false positives. For example, it may return non-persistent sessions that
 * have had their cookies cleared, such as when the browser is closed.
 */
export const getAccountSessions = ({
    api,
    cache,
}: {
    api: ApiWithListener;
    cache: { support: boolean; value: ActiveSessionLite[] };
}) => {
    const accountSessions = readAccountSessions();

    if (accountSessions === undefined) {
        return { support: false };
    }

    const accountLocalIDSessions = getLocalIDSessionString(accountSessions.map(({ localID }) => localID));
    const cachedLocalIDSessions = getLocalIDSessionString(cache.value.map((item) => item.persisted.localID));

    if (cachedLocalIDSessions === accountLocalIDSessions) {
        return { support: true };
    }

    return {
        support: true,
        promise: getActiveSessionsData({ persistedSessions: accountSessions, api: getSilentApi(api) }),
    };
};
