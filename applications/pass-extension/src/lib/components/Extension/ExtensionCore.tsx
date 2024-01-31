import type { PropsWithChildren } from 'react';
import { type FC, useCallback, useMemo, useRef } from 'react';

import * as config from 'proton-pass-extension/app/config';
import locales from 'proton-pass-extension/app/locales';
import { API_PROXY_URL } from 'proton-pass-extension/app/worker/services/api-proxy';
import { promptForPermissions } from 'proton-pass-extension/lib/utils/permissions';

import type { PassCoreContextValue } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { pageMessage, resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message';
import { getWebStoreUrl } from '@proton/pass/lib/extension/utils/browser';
import browser from '@proton/pass/lib/globals/browser';
import { createI18nService } from '@proton/pass/lib/i18n/service';
import { isProtonPassEncryptedImport } from '@proton/pass/lib/import/reader';
import { type ClientEndpoint, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import type { ParsedUrl } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';

const getDomainImageFactory =
    (endpoint: ClientEndpoint): PassCoreContextValue['getDomainImage'] =>
    async (domain, signal) => {
        const basePath = BUILD_TARGET === 'firefox' ? config.API_URL : API_PROXY_URL;
        const url = `core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
        const requestUrl = `${basePath}/${url}`;

        signal.onabort = () =>
            sendMessage(
                resolveMessageFactory(endpoint)({
                    type: WorkerMessageType.FETCH_ABORT,
                    payload: { requestUrl },
                })
            );

        /* Forward the abort signal to the extension service worker. */
        return fetch(requestUrl, { signal }).then(imageResponsetoDataURL);
    };

const createOTPGenerator =
    (endpoint: ClientEndpoint): PassCoreContextValue['generateOTP'] =>
    (payload) =>
        sendMessage.on(
            resolveMessageFactory(endpoint)({ type: WorkerMessageType.OTP_CODE_GENERATE, payload }),
            (response) => (response.type === 'success' ? response : null)
        );

/** Popup may not auto-close on firefox  */
const createLinkHandler =
    (endpoint: ClientEndpoint): PassCoreContextValue['onLink'] =>
    (url) => {
        browser.tabs
            .create({ url })
            .then(() => endpoint === 'popup' && BUILD_TARGET === 'firefox' && window.close())
            .catch(noop);
    };

const createTelemetryHandler =
    (endpoint: ClientEndpoint): PassCoreContextValue['onTelemetry'] =>
    (event) =>
        sendMessage(
            resolveMessageFactory(endpoint)({
                type: WorkerMessageType.TELEMETRY_EVENT,
                payload: { event },
            })
        );

const openSettings: PassCoreContextValue['openSettings'] = (page) => {
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
};

const createOnboardingAck =
    (endpoint: ClientEndpoint): PassCoreContextValue['onOnboardingAck'] =>
    (message) => {
        void sendMessage(
            resolveMessageFactory(endpoint)({
                type: WorkerMessageType.ONBOARDING_ACK,
                payload: { message },
            })
        );
    };

/* CryptoProxy is only initalized in the worker execution
 * context. Send a pageMessage (as of now the importer is
 * handled in the settings page) to decrypt the payload
 * before reading the .zip file contents */
const prepareImport: PassCoreContextValue['prepareImport'] = async (payload) =>
    isProtonPassEncryptedImport(payload)
        ? sendMessage.on(pageMessage({ type: WorkerMessageType.IMPORT_DECRYPT, payload }), (res) => {
              if (res.type === 'error') throw new Error(res.error);
              return res.payload;
          })
        : payload;

const exportData: PassCoreContextValue['exportData'] = (payload) =>
    sendMessage.on(pageMessage({ type: WorkerMessageType.EXPORT_REQUEST, payload }), (res) => {
        if (res.type === 'error') throw new Error(res.error);
        return transferableToFile(res.file);
    });

const onForceUpdate: PassCoreContextValue['onForceUpdate'] = () =>
    sendMessage(pageMessage({ type: WorkerMessageType.WORKER_RELOAD }));

export const ExtensionCore: FC<PropsWithChildren<{ endpoint: ClientEndpoint }>> = ({ children, endpoint }) => {
    const currentTabUrl = useRef<MaybeNull<ParsedUrl>>(null);

    const i18n = useMemo(
        () =>
            createI18nService({
                locales,
                /* resolve the extension locale through the I18nService instead of reading
                 * from the store as some extension sub-apps are not redux connected but
                 * should be aware of the current localisation setting */
                getLocale: () =>
                    sendMessage.on(
                        resolveMessageFactory(endpoint)({ type: WorkerMessageType.LOCALE_REQUEST }),
                        (res) => (res.type === 'success' ? res.locale : undefined)
                    ),
            }),
        []
    );

    return (
        <PassCoreProvider
            config={config}
            endpoint={endpoint}
            exportData={exportData}
            generateOTP={useCallback(createOTPGenerator(endpoint), [])}
            getCurrentTabUrl={() => currentTabUrl.current}
            getDomainImage={getDomainImageFactory(endpoint)}
            getRatingURL={getWebStoreUrl}
            onForceUpdate={onForceUpdate}
            onLink={createLinkHandler(endpoint)}
            onOnboardingAck={createOnboardingAck(endpoint)}
            onTelemetry={useCallback(createTelemetryHandler(endpoint), [])}
            openSettings={openSettings}
            prepareImport={prepareImport}
            promptForPermissions={promptForPermissions}
            setCurrentTabUrl={(parsedUrl) => (currentTabUrl.current = parsedUrl)}
            i18n={i18n}
        >
            {children}
        </PassCoreProvider>
    );
};
