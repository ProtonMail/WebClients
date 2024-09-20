import { useEffect } from 'react';

import { differenceInDays } from 'date-fns';

import { useApi } from '@proton/components/hooks';
import { TelemetryMailDefaultMailto, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';

import type { DefaultProtocol } from './DefaultProtocol';
import { getInboxDesktopInfo, hasInboxDesktopFeature, invokeInboxDesktopIPC } from './ipcHelpers';

const HOUR_INTERVAL = 3600000;

const getDefaultMailto = () => getInboxDesktopInfo('defaultMailto');
const checkDefaultMailto = () => invokeInboxDesktopIPC({ type: 'checkDefaultMailtoAndSignal' });
const defaultMailtoTelemetryReported = () => invokeInboxDesktopIPC({ type: 'defaultMailtoTelemetryReported' });

function checkMailtoTelemetryIsNeeded() {
    const data = getDefaultMailto();
    const now = new Date();
    if (differenceInDays(now, data.lastReport.timestamp) < 1) {
        return;
    }

    checkDefaultMailto();
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

    defaultMailtoTelemetryReported();
}

export function useInboxDesktopHeartbeat() {
    const api = useApi();

    useEffect(() => {
        if (!hasInboxDesktopFeature('MailtoTelemetry')) {
            return;
        }

        const checked = window.ipcInboxMessageBroker!.on!('defaultMailtoChecked', (payload) =>
            sendMailtoTelemetry(api, payload)
        );

        const intervalFunction = setInterval(() => {
            checkMailtoTelemetryIsNeeded();
            // TODO(jcuth): sendDesktopSettingsTelemetryIfNeeded();
        }, HOUR_INTERVAL);

        return () => {
            checked.removeListener();
            clearInterval(intervalFunction);
        };
    }, [api]);
}
