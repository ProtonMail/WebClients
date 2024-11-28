import { useEffect } from 'react';

import { differenceInDays, getUnixTime } from 'date-fns';

import { useApi } from '@proton/components';
import { TelemetryMailDefaultMailto, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';

import type { DefaultProtocol } from './DefaultProtocol';
import type { IPCInboxHostUpdateListenerRemover } from './desktopTypes';
import {
    addIPCHostUpdateListener,
    emptyListener,
    getInboxDesktopInfo,
    hasInboxDesktopFeature,
    invokeInboxDesktopIPC,
} from './ipcHelpers';

const HOUR_INTERVAL = 3600000;

const getDefaultMailto = () => getInboxDesktopInfo('defaultMailto');
const checkDefaultMailto = () => invokeInboxDesktopIPC({ type: 'checkDefaultMailtoAndSignal' });
const defaultMailtoTelemetryReported = (timestamp: number) =>
    invokeInboxDesktopIPC({ type: 'defaultMailtoTelemetryReported', payload: timestamp });
const getUnixTimeNow = () => {
    return getUnixTime(new Date());
};

const isAtLeastDayAgo = (lastUnixTime: number) => {
    const nowMs = getUnixTimeNow() * 1000;
    const lastMs = lastUnixTime * 1000;
    return differenceInDays(nowMs, lastMs) > 0;
};

function checkMailtoTelemetryIsNeeded() {
    if (!hasInboxDesktopFeature('MailtoTelemetry')) {
        return;
    }

    const data = getDefaultMailto();
    if (!isAtLeastDayAgo(data.lastReport.timestamp)) {
        return;
    }

    void checkDefaultMailto();
}

type MailtoDimensions = {
    isDefault: 'true' | 'false' | 'unknown';
    changeSinceLast: 'yes_to_no' | 'no_to_yes' | 'no_change';
};

function sendMailtoTelemetry(api: Api, data: DefaultProtocol) {
    const dimensions: MailtoDimensions = {
        isDefault: 'unknown',
        changeSinceLast: 'no_change',
    };

    if (data.wasChecked) {
        dimensions.isDefault = data.isDefault ? 'true' : 'false';

        if (data.lastReport.wasDefault && !data.isDefault) {
            dimensions.changeSinceLast = 'yes_to_no';
        }
        if (!data.lastReport.wasDefault && data.isDefault) {
            dimensions.changeSinceLast = 'no_to_yes';
        }
    }

    void sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.mailDesktopDefaultMailto,
        event: TelemetryMailDefaultMailto.mailto_heartbeat,
        dimensions,
    });

    void defaultMailtoTelemetryReported(getUnixTimeNow());
}

export function useInboxDesktopHeartbeat() {
    const api = useApi();

    useEffect(() => {
        const defaultMailtoChecked: IPCInboxHostUpdateListenerRemover = hasInboxDesktopFeature('MailtoTelemetry')
            ? addIPCHostUpdateListener('defaultMailtoChecked', (payload) => sendMailtoTelemetry(api, payload))
            : emptyListener;

        checkMailtoTelemetryIsNeeded();
        const intervalFunction = setInterval(() => {
            checkMailtoTelemetryIsNeeded();
        }, HOUR_INTERVAL);

        return () => {
            defaultMailtoChecked.removeListener();
            clearInterval(intervalFunction);
        };
    }, [api]);
}

export const getUnixTimeNowTestOnly = getUnixTimeNow;
export const isAtLeastDayAgoTestOnly = isAtLeastDayAgo;
