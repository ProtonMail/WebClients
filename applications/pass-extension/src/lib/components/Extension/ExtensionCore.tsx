import type { PropsWithChildren } from 'react';
import { type FC, useCallback, useRef } from 'react';

import * as config from 'proton-pass-extension/app/config';
import locales from 'proton-pass-extension/app/locales';
import { API_PROXY_URL } from 'proton-pass-extension/app/worker/constants.runtime';
import { createCoreServiceBridge } from 'proton-pass-extension/lib/services/core.bridge';
import { createMonitorBridge } from 'proton-pass-extension/lib/services/monitor.bridge';
import { promptForPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { createPopupController } from 'proton-pass-extension/lib/utils/popup';
import { reloadManager } from 'proton-pass-extension/lib/utils/reload';

import useInstance from '@proton/hooks/useInstance';
import { AuthStoreProvider } from '@proton/pass/components/Core/AuthStoreProvider';
import type { ExtensionClientState, PassCoreProviderProps } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { createPassThemeManager } from '@proton/pass/components/Layout/Theme/ThemeService';
import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { UnlockProvider } from '@proton/pass/components/Lock/UnlockProvider';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { getRequestIDHeaders } from '@proton/pass/lib/api/fetch-controller';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { getExtensionLocalStorage } from '@proton/pass/lib/extension/storage';
import { getWebStoreUrl } from '@proton/pass/lib/extension/utils/browser';
import browser from '@proton/pass/lib/globals/browser';
import { createI18nService } from '@proton/pass/lib/i18n/service';
import { createSettingsService } from '@proton/pass/lib/settings/service';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import type { LocalStoreData } from '@proton/pass/types';
import { type ClientEndpoint, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import createStore from '@proton/shared/lib/helpers/store';
import noop from '@proton/utils/noop';

export type ExtensionCoreProps = {
    endpoint: ClientEndpoint;
    theme?: PassThemeOption;
    wasm?: boolean;
};

const getPassCoreProviderProps = (
    endpoint: ClientEndpoint,
    config: PassConfig,
    theme?: PassThemeOption
): PassCoreProviderProps => {
    const messageFactory = resolveMessageFactory(endpoint);

    /** Read-only settings service */
    const settings = createSettingsService({
        clear: noop,
        sync: noop,
        resolve: async () => {
            const data = await getExtensionLocalStorage<LocalStoreData>().getItem('settings');
            if (!data) throw new Error('Missing settings');
            return JSON.parse(data);
        },
    });

    return {
        config,
        core: createPassCoreProxy(createCoreServiceBridge(messageFactory)),
        endpoint,
        i18n: createI18nService({
            locales,
            loadDateLocale: true,
            getLocale: () => settings.resolve().then(prop('locale')).catch(noop),
        }),
        monitor: createMonitorBridge(messageFactory),
        settings,
        spotlight: {
            acknowledge: (message) =>
                sendMessage(messageFactory({ type: WorkerMessageType.SPOTLIGHT_ACK, payload: { message } }))
                    .then((res) => res.type === 'success')
                    .catch(() => false),
            check: (message) =>
                sendMessage(messageFactory({ type: WorkerMessageType.SPOTLIGHT_CHECK, payload: { message } }))
                    .then((res) => res.type === 'success' && res.enabled)
                    .catch(() => false),
        },
        theme: createPassThemeManager({
            getInitialTheme: async () => theme ?? (await settings.resolve().catch(noop))?.theme,
        }),

        generateOTP: (payload) =>
            sendMessage.on(messageFactory({ type: WorkerMessageType.OTP_CODE_GENERATE, payload }), (response) =>
                response.type === 'success' ? response : null
            ),

        getDomainImage: async (domain, signal) => {
            const basePath = BUILD_TARGET === 'firefox' || BUILD_TARGET === 'safari' ? config.API_URL : API_PROXY_URL;
            const url = `core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
            const requestUrl = `${basePath}/${url}`;

            if (BUILD_TARGET === 'safari') {
                return sendMessage.on(
                    messageFactory({ type: WorkerMessageType.FETCH_DOMAINIMAGE, payload: { url: requestUrl } }),
                    (res) => {
                        if (res.type === 'error') throw new Error(res.error);
                        return res.result;
                    }
                );
            }

            const [headers, requestId] = BUILD_TARGET === 'chrome' ? getRequestIDHeaders() : [];

            if (BUILD_TARGET === 'chrome') {
                signal.onabort = () =>
                    sendMessage(
                        messageFactory({
                            type: WorkerMessageType.FETCH_ABORT,
                            payload: { requestId: requestId! },
                        })
                    );
            }

            /* Forward the abort signal to the extension service worker. */
            return fetch(requestUrl, { signal, headers }).then(imageResponsetoDataURL);
        },

        getLogs: () =>
            sendMessage.on(messageFactory({ type: WorkerMessageType.LOG_REQUEST }), (res) =>
                res.type === 'success' ? res.logs : []
            ),

        getRatingURL: getWebStoreUrl,

        promptForPermissions,

        onLink: (url, options) =>
            options?.replace
                ? browser.tabs.update({ url }).catch(noop)
                : browser.tabs
                      .create({ url })
                      /** Popup may not auto-close on firefox  */
                      .then(() => endpoint === 'popup' && BUILD_TARGET === 'firefox' && window.close())
                      .catch(noop),

        onForceUpdate: () =>
            sendMessage(messageFactory({ type: WorkerMessageType.WORKER_RELOAD }))
                .then((res) => {
                    if (res.type === 'error' && res.critical) void reloadManager.runtimeReload({ immediate: true });
                })
                .catch(noop),

        openSettings: (page) => {
            const settingsUrl = browser.runtime.getURL('/settings.html');
            const url = `${settingsUrl}#/${page ?? ''}`;

            browser.tabs
                .query({ url: settingsUrl })
                .then(async (match) => {
                    await (match.length > 0 && match[0].id
                        ? browser.tabs.update(match[0].id, { highlighted: true, url })
                        : browser.tabs.create({ url }));

                    window.close();
                })
                .catch(noop);
        },

        onTelemetry: (Event, Values, Dimensions, platform) =>
            sendMessage(
                messageFactory({
                    type: WorkerMessageType.TELEMETRY_EVENT,
                    payload: { event: createTelemetryEvent(Event, Values, Dimensions, platform) },
                })
            ).catch(noop),

        onB2BEvent: (event) =>
            sendMessage(messageFactory({ type: WorkerMessageType.B2B_EVENT, payload: { event } }))
                .then((res) => res.type === 'success')
                .catch(() => false),

        writeToClipboard: (value) => navigator.clipboard.writeText(value),

        popup: endpoint === 'popup' ? createPopupController() : undefined,
    };
};

export const ExtensionCore: FC<PropsWithChildren<ExtensionCoreProps>> = ({ children, endpoint, theme, wasm }) => {
    const extensionClientState = useRef<MaybeNull<ExtensionClientState>>(null);
    const coreProps = useInstance(() => getPassCoreProviderProps(endpoint, config, theme));
    const authStore = useInstance(() => exposeAuthStore(createAuthStore(createStore())));
    const message = resolveMessageFactory(endpoint);

    const unlock = useCallback(
        async (payload: UnlockDTO): Promise<void> =>
            sendMessage(message({ type: WorkerMessageType.AUTH_UNLOCK, payload })).then((res) => {
                if (res.type === 'error') throw new Error();
                if (!res.ok) throw new Error(res.error ?? '');
            }),
        []
    );

    return (
        <PassCoreProvider
            {...coreProps}
            getExtensionClientState={() => extensionClientState.current}
            setExtensionClientState={(value) => (extensionClientState.current = value)}
            wasm={wasm}
        >
            <AuthStoreProvider store={authStore}>
                <UnlockProvider unlock={unlock}>{children}</UnlockProvider>
            </AuthStoreProvider>
        </PassCoreProvider>
    );
};
