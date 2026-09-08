import { differenceInDays, getUnixTime } from 'date-fns';

import type { Api } from '../interfaces';
import type { IPCInboxHostUpdateListenerRemover } from './desktopTypes';
import { addIPCHostUpdateListener, emptyListener, hasInboxDesktopFeature } from './ipcHelpers';
import {
    checkDailyStats,
    checkDefaultMailto,
    getDailyStats,
    getDefaultMailto,
    sendDailyTelemetry,
    sendMailtoTelemetry,
} from './telemetry';

const HOUR_INTERVAL = 3600000;

const getUnixTimeNow = () => {
    return getUnixTime(new Date());
};

const isAtLeastDayAgo = (lastUnixTime: number) => {
    const nowMs = getUnixTimeNow() * 1000;
    const lastMs = lastUnixTime * 1000;
    return differenceInDays(nowMs, lastMs) > 0;
};

const checkMailtoTelemetryIsNeeded = () => {
    if (!hasInboxDesktopFeature('MailtoTelemetry')) {
        return;
    }

    const data = getDefaultMailto();
    if (!isAtLeastDayAgo(data.lastReport.timestamp)) {
        return;
    }

    void checkDefaultMailto();
};

const checkDailyStatIsNeeded = () => {
    if (!hasInboxDesktopFeature('StatsTelemetry')) {
        return;
    }

    const data = getDailyStats();
    if (!isAtLeastDayAgo(data.lastReport)) {
        return;
    }

    void checkDailyStats();
};

/** Starts inbox desktop heartbeat listeners. Returns a cleanup function for use in React effects. */
export const startInboxDesktopHeartbeat = (api: Api): (() => void) => {
    // This won't be needed eventually. During transition we don't want to
    // use default mailto telemetry, so we disable the flag in electron.
    const defaultMailtoChecked: IPCInboxHostUpdateListenerRemover = hasInboxDesktopFeature('MailtoTelemetry')
        ? addIPCHostUpdateListener('defaultMailtoChecked', (payload) =>
              sendMailtoTelemetry(api, payload, getUnixTimeNow())
          )
        : emptyListener;

    const statsTelemetryChecked: IPCInboxHostUpdateListenerRemover = hasInboxDesktopFeature('StatsTelemetry')
        ? addIPCHostUpdateListener('dailyStatsChecked', (payload) => sendDailyTelemetry(api, payload, getUnixTimeNow()))
        : emptyListener;

    checkDailyStatIsNeeded();
    checkMailtoTelemetryIsNeeded();
    const intervalFunction = setInterval(() => {
        checkDailyStatIsNeeded();
        checkMailtoTelemetryIsNeeded();
    }, HOUR_INTERVAL);

    return () => {
        statsTelemetryChecked.removeListener();
        defaultMailtoChecked.removeListener();
        clearInterval(intervalFunction);
    };
};

export const getUnixTimeNowTestOnly = getUnixTimeNow;
export const isAtLeastDayAgoTestOnly = isAtLeastDayAgo;
