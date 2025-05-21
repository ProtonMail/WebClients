import { hasPauseCriteria } from 'proton-pass-extension/app/content/context/utils';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { MODEL_VERSION } from '@proton/pass/constants';
import { clientReady } from '@proton/pass/lib/client';
import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import {
    selectAutofillSettings,
    selectDisallowedDomains,
    selectFeatureFlags,
    selectTelemetryEnabled,
    selectUserTier,
} from '@proton/pass/store/selectors';
import type { AutofillCheckFormMessage, ExtensionStorage, WorkerMessageResponse } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import type { ExtensionCopiedFromLoginDimensions } from '@proton/pass/types/data/telemetry';
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
            const autofillTelemetryEvents = [
                TelemetryEventName.ExtensionCopiedFromLogin,
                TelemetryEventName.AutosaveDismissed,
                TelemetryEventName.ExtensionUsed,
            ];

            if (!autofillTelemetryEnabled && autofillTelemetryEvents.includes(event.Event)) {
                return true;
            }

            // FIXME: improve "extra" type definition so we don't need to verify if it's defined
            if (extra) {
                switch (event.Event) {
                    case TelemetryEventName.ExtensionCopiedFromLogin: {
                        const { itemUrls, extensionField } = extra;
                        const tab = first(await browser.tabs.query({ active: true }));
                        const tabUrl = parseUrl(tab?.url);

                        const matchedLoginCount = ctx.service.autofill.getLoginCandidates(tabUrl).length;
                        const loginAutofillSettingsEnabled = selectAutofillSettings(state).login;
                        const disallowedDomains = selectDisallowedDomains(state);

                        const loginFormDetected = await (async () => {
                            try {
                                if (isSupportedSenderUrl(tabUrl) && tab?.id) {
                                    // FIXME when supporting cross frames
                                    const res = await browser.tabs.sendMessage<
                                        AutofillCheckFormMessage,
                                        WorkerMessageResponse<WorkerMessageType.AUTOFILL_CHECK_FORM>
                                    >(tab.id, backgroundMessage({ type: WorkerMessageType.AUTOFILL_CHECK_FORM }), {
                                        frameId: 0,
                                    });
                                    return res.hasLoginForm;
                                } else return false;
                            } catch {
                                return false;
                            }
                        })();

                        const dimensions: ExtensionCopiedFromLoginDimensions = {
                            extensionField,
                            hasLoginItemForCurrentWebsite: matchedLoginCount > 0 ? 1 : 0,
                            uniqueMatch: matchedLoginCount === 1 ? 1 : 0,
                            extensionCopiedFromCurrentPage: itemUrls.some((itemUrl) => {
                                return parseUrl(itemUrl).domain === tabUrl.domain;
                            })
                                ? 1
                                : 0,
                            autofillLoginFormDetected: loginFormDetected ? 1 : 0,
                            loginAutofillEnabled: loginAutofillSettingsEnabled ? 1 : 0,
                            autofillPaused: hasPauseCriteria({
                                disallowedDomains: disallowedDomains,
                                url: tabUrl,
                            }).Autofill
                                ? 1
                                : 0,
                            modelVersion: MODEL_VERSION,
                        };

                        event.Dimensions = dimensions;
                        break;
                    }
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
