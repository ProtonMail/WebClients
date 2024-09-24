import type { PropsWithChildren } from 'react';
import { type FC, useCallback, useMemo, useRef } from 'react';

import * as config from 'proton-pass-extension/app/config';
import locales from 'proton-pass-extension/app/locales';
import { API_PROXY_URL } from 'proton-pass-extension/app/worker/services/api-proxy';
import { createCoreServiceBridge } from 'proton-pass-extension/lib/services/core.bridge';
import { createMonitorBridge } from 'proton-pass-extension/lib/services/monitor.bridge';
import { promptForPermissions } from 'proton-pass-extension/lib/utils/permissions';

import useInstance from '@proton/hooks/useInstance';
import { AuthStoreProvider } from '@proton/pass/components/Core/AuthStoreProvider';
import type { PassCoreProviderProps } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { UnlockProvider } from '@proton/pass/components/Lock/UnlockProvider';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { getRequestIDHeaders } from '@proton/pass/lib/api/fetch-controller';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { createPassCoreProxy } from '@proton/pass/lib/core/proxy';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { getWebStoreUrl } from '@proton/pass/lib/extension/utils/browser';
import browser from '@proton/pass/lib/globals/browser';
import { createI18nService } from '@proton/pass/lib/i18n/service';
import { isProtonPassEncryptedImport } from '@proton/pass/lib/import/reader';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { type ClientEndpoint, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import createStore from '@proton/shared/lib/helpers/store';
import noop from '@proton/utils/noop';

const getExtensionCoreProps = (endpoint: ClientEndpoint, config: PassConfig): PassCoreProviderProps => {
    const messageFactory = resolveMessageFactory(endpoint);

    return {
        config,
        core: createPassCoreProxy(createCoreServiceBridge(messageFactory)),
        endpoint,
        i18n: createI18nService({
            locales,
            loadDateLocale: true,
            /* resolve the extension locale through the I18nService instead of reading
             * from the store as some extension sub-apps are not redux connected but
             * should be aware of the current localisation setting */
            getLocale: () =>
                sendMessage.on(resolveMessageFactory(endpoint)({ type: WorkerMessageType.LOCALE_REQUEST }), (res) =>
                    res.type === 'success' ? res.locale : undefined
                ),
        }),
        monitor: createMonitorBridge(messageFactory),

        exportData: (payload) =>
            sendMessage.on(messageFactory({ type: WorkerMessageType.EXPORT_REQUEST, payload }), (res) => {
                if (res.type === 'error') throw new Error(res.error);
                return transferableToFile(res.file);
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

        /* CryptoProxy is only initalized in the worker execution
         * context. Send a pageMessage (as of now the importer is
         * handled in the settings page) to decrypt the payload
         * before reading the .zip file contents */
        prepareImport: async (payload) =>
            isProtonPassEncryptedImport(payload)
                ? sendMessage.on(messageFactory({ type: WorkerMessageType.IMPORT_DECRYPT, payload }), (res) => {
                      if (res.type === 'error') throw new Error(res.error);
                      return res.payload;
                  })
                : payload,

        promptForPermissions,

        onboardingAcknowledge: (message) => {
            sendMessage(messageFactory({ type: WorkerMessageType.ONBOARDING_ACK, payload: { message } })).catch(noop);
        },

        onboardingCheck: (message) =>
            sendMessage(messageFactory({ type: WorkerMessageType.ONBOARDING_CHECK, payload: { message } }))
                .then((res) => res.type === 'success' && res.enabled)
                .catch(() => false),

        onLink: (url) =>
            browser.tabs
                .create({ url })
                /** Popup may not auto-close on firefox  */
                .then(() => endpoint === 'popup' && BUILD_TARGET === 'firefox' && window.close())
                .catch(noop),

        onForceUpdate: () =>
            sendMessage(messageFactory({ type: WorkerMessageType.WORKER_RELOAD }))
                .then((res) => res.type === 'error' && res.critical && browser.runtime.reload())
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
            sendMessage(messageFactory({ type: WorkerMessageType.B2B_EVENT, payload: { event } })).catch(noop),

        writeToClipboard: (value) => navigator.clipboard.writeText(value),
    };
};

export const ExtensionCore: FC<PropsWithChildren<{ endpoint: ClientEndpoint }>> = ({ children, endpoint }) => {
    const currentTabUrl = useRef<MaybeNull<ParsedUrl>>(null);
    const coreProps = useMemo(() => getExtensionCoreProps(endpoint, config), []);
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
            getCurrentTabUrl={() => currentTabUrl.current}
            setCurrentTabUrl={(parsedUrl) => (currentTabUrl.current = parsedUrl)}
        >
            <AuthStoreProvider store={authStore}>
                <UnlockProvider unlock={unlock}>{children}</UnlockProvider>
            </AuthStoreProvider>
        </PassCoreProvider>
    );
};
