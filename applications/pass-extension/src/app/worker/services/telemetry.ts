import { hasPauseCriteria } from 'proton-pass-extension/app/content/context/utils';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { MODEL_VERSION } from '@proton/pass/constants';
import { clientReady } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { AUTOFILL_TELEMETRY_EVENTS, telemetryBool } from '@proton/pass/lib/telemetry/utils';
import {
    selectAutofillSettings,
    selectDisallowedDomains,
    selectFeatureFlags,
    selectTelemetryEnabled,
    selectUserTier,
} from '@proton/pass/store/selectors';
import type { ExtensionStorage } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array/first';
import type { EventDispatcherAlarm } from '@proton/pass/utils/event/dispatcher';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { isSupportedSenderUrl } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

export const TELEMETRY_ALARM_NAME = 'PassTelemetryAlarm';

export const createAlarmHandles = (alarmName: string): EventDispatcherAlarm => {
    return {
        reset: () => browser.alarms.clear(alarmName).catch(noop),
        when: async () => (await browser.alarms.get(alarmName).catch(noop))?.scheduledTime,
        set: (when) => browser.alarms.create(alarmName, { when }),
    };
};

export const createTelemetryService = (storage: ExtensionStorage<Record<'telemetry', string>>) => {
    const { push, send, start, stop } = createCoreTelemetryService({
        alarm: createAlarmHandles(TELEMETRY_ALARM_NAME),
        storage,
        getEnabled: withContext((ctx) => selectTelemetryEnabled(ctx.service.store.getState())),
        getStorageKey: () => 'telemetry',
        getUserTier: withContext((ctx) => selectUserTier(ctx.service.store.getState())),
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.TELEMETRY_EVENT,
        withContext(async (ctx, { payload: { event, extra } }) => {
            const state = ctx.service.store.getState();
            const autofillTelemetryEnabled = selectFeatureFlags(state)?.LoginAutofillTelemetry;

            if (!autofillTelemetryEnabled && AUTOFILL_TELEMETRY_EVENTS.includes(event.Event)) return true;

            switch (event.Event) {
                case TelemetryEventName.ExtensionCopiedFromLogin: {
                    if (!extra) return false;

                    const tab = first(await browser.tabs.query({ active: true, currentWindow: true }));
                    const url = tab?.url;
                    const tabUrl = parseUrl(url);
                    const tabId = tab?.id;
                    const validTab = tabId && isSupportedSenderUrl(tabUrl);

                    const { itemUrls, extensionField } = extra;
                    const matchedLoginCount = ctx.service.autofill.getLoginCandidates({ url }).length;
                    const loginAutofillSettingsEnabled = selectAutofillSettings(state).login ?? false;
                    const disallowedDomains = selectDisallowedDomains(state);
                    const itemUrlsMatchTab = itemUrls.some((itemUrl) => parseUrl(itemUrl).domain === tabUrl.domain);
                    const autofillPaused = hasPauseCriteria({ disallowedDomains, url: tabUrl }).Autofill;
                    const loginFormDetected = validTab ? await ctx.service.autofill.queryTabLoginForms(tabId) : false;

                    event.Dimensions = {
                        autofillLoginFormDetected: telemetryBool(loginFormDetected),
                        autofillPaused: telemetryBool(autofillPaused),
                        extensionCopiedFromCurrentPage: telemetryBool(itemUrlsMatchTab),
                        extensionField,
                        hasLoginItemForCurrentWebsite: telemetryBool(matchedLoginCount > 0),
                        loginAutofillEnabled: telemetryBool(loginAutofillSettingsEnabled),
                        modelVersion: MODEL_VERSION,
                        uniqueMatch: telemetryBool(matchedLoginCount === 1),
                    };

                    break;
                }
            }

            void push(event);
            return true;
        })
    );

    browser.alarms.onAlarm.addListener(
        withContext((ctx, { name }) => {
            /** Ensure the worker is ready before attempting to send events,
             * as this will be an authenticated call. If the alarm goes off and
             * the worker has not booted, the bundle will be sent on the next boot. */
            const ready = clientReady(ctx.getState().status);
            if (ready && name === TELEMETRY_ALARM_NAME) return send();
        })
    );

    return { start, stop, push };
};

export type TelemetryService = ReturnType<typeof createTelemetryService>;
