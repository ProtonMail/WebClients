import { c } from 'ttag';

import type { Maybe } from '@proton/pass/types';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

export enum ConnectivityStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    DOWNTIME = 'DOWNTIME',
}

const CONNECTIVITY_RETRY_TIMEOUT = 5_000;

export const intoConnectivityStatus = <T extends { online: boolean; unreachable: boolean }>(
    state: T
): ConnectivityStatus => {
    if (state.unreachable) return ConnectivityStatus.DOWNTIME;
    return ConnectivityStatus[state.online ? 'ONLINE' : 'OFFLINE'];
};

export const getConnectivityRetryTimeout = (status: ConnectivityStatus, retryCount: number): number =>
    CONNECTIVITY_RETRY_TIMEOUT *
    (status === ConnectivityStatus.DOWNTIME ? FIBONACCI_LIST[retryCount % FIBONACCI_LIST.length] : 1);

export const getConnectivityWarning = (connectivity: ConnectivityStatus): Maybe<string> => {
    switch (connectivity) {
        case ConnectivityStatus.OFFLINE:
            return c('Info').t`No network connection`;
        case ConnectivityStatus.DOWNTIME:
            return c('Info').t`Servers are unreachable`;
    }
};
