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
