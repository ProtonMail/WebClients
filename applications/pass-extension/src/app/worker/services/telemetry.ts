import { clientReady } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { hasPauseCriteria } from '@proton/pass/lib/settings/pause-list';
import {
    type TelemetryService as CoreTelemetryService,
    createCoreTelemetryService,
} from '@proton/pass/lib/telemetry/service';
import { telemetryBool } from '@proton/pass/lib/telemetry/utils';
import { parseUrl } from '@proton/pass/lib/urls/utils/parser';
import {
    selectAutofillSettings,
    selectDisallowedDomains,
    selectOrgDomains,
} from '@proton/pass/store/selectors/settings';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors/user';
import { NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS, TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { ExtensionStorage } from '@proton/pass/types/worker/storage';
import { first } from '@proton/pass/utils/array/first';

import { createExtensionAlarm } from '../../../lib/utils/alarm';
import { isSupportedSenderUrl } from '../../../lib/utils/sender';
import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context/inject';

export const TELEMETRY_ALARM_NAME = 'PassTelemetryAlarm';

export const createTelemetryService = (storage: ExtensionStorage<Record<'telemetry', string>>) => {
    const service: CoreTelemetryService = createCoreTelemetryService({
        alarm: createExtensionAlarm(
            TELEMETRY_ALARM_NAME,
            withContext((ctx) => {
                /** Ensure the worker is ready before attempting to send events,
                 * as this will be an authenticated call. If the alarm goes off and
                 * the worker has not booted, the bundle will be sent on the next boot. */
                const ready = clientReady(ctx.getState().status);
                if (ready) return service.send();
            })
        ),
        storage,
        getEnabled: withContext((ctx) => selectTelemetryEnabled(ctx.service.store.getState())),
        getStorageKey: () => 'telemetry',
        getUserTier: withContext((ctx) => selectUserTier(ctx.service.store.getState())),
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.TELEMETRY_EVENT,
        withContext(async (ctx, { payload: { event, extra } }) => {
            const state = ctx.service.store.getState();

            switch (event.Event) {
                case TelemetryEventName.ExtensionCopiedFromLogin: {
                    if (!extra) return false;

                    const tab = first(await browser.tabs.query({ active: true, currentWindow: true }));
                    const url = tab?.url;
                    const tabUrl = parseUrl(url);
                    const tabId = tab?.id;
                    const validTab = tabId && isSupportedSenderUrl(tabUrl);

                    const { itemUrls, extensionField } = extra;
                    const matchedLoginCount = ctx.service.autofill.getLoginCandidates(url).length;
                    const loginAutofillSettingsEnabled = selectAutofillSettings(state).login ?? false;
                    const disallowedDomains = selectDisallowedDomains(state);
                    const orgDomains = selectOrgDomains(state);
                    const itemUrlsMatchTab = itemUrls.some((itemUrl) => parseUrl(itemUrl).domain === tabUrl.domain);
                    const autofillPaused = hasPauseCriteria({ disallowedDomains, orgDomains, url: tabUrl }).Autofill;
                    // no valid tab to query the content script for the page's language
                    const { loginFormDetected, telemetry: pageTelemetry } = validTab
                        ? await ctx.service.autofill.queryTabLoginForms(tabId)
                        : { loginFormDetected: false, telemetry: NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS };

                    event.Dimensions = {
                        autofillLoginFormDetected: telemetryBool(loginFormDetected),
                        autofillPaused: telemetryBool(autofillPaused),
                        extensionCopiedFromCurrentPage: telemetryBool(itemUrlsMatchTab),
                        extensionField,
                        hasLoginItemForCurrentWebsite: telemetryBool(matchedLoginCount > 0),
                        loginAutofillEnabled: telemetryBool(loginAutofillSettingsEnabled),
                        uniqueMatch: telemetryBool(matchedLoginCount === 1),
                        ...pageTelemetry,
                    };

                    break;
                }
            }

            void service.push(event);
            return true;
        })
    );

    return {
        push: service.push,
        start: service.start,
        stop: service.stop,
    };
};

export type TelemetryService = ReturnType<typeof createTelemetryService>;
