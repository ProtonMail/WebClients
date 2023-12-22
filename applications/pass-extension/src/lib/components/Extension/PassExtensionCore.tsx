import { type FC, useCallback } from 'react';

import * as config from 'proton-pass-extension/app/config';
import { API_PROXY_URL } from 'proton-pass-extension/app/worker/services/api-proxy';
import { promptForPermissions } from 'proton-pass-extension/lib/utils/permissions';

import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message';
import { getWebStoreUrl } from '@proton/pass/lib/extension/utils/browser';
import browser from '@proton/pass/lib/globals/browser';
import type { OnboardingMessage } from '@proton/pass/types';
import { type ClientEndpoint, type Maybe, type OtpRequest, WorkerMessageType } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import noop from '@proton/utils/noop';

const getDomainImageFactory =
    (endpoint: ClientEndpoint) =>
    async (domain: string, signal: AbortSignal): Promise<Maybe<string>> => {
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

const createOTPGenerator = (endpoint: ClientEndpoint) => (payload: OtpRequest) =>
    sendMessage.on(
        resolveMessageFactory(endpoint)({ type: WorkerMessageType.OTP_CODE_GENERATE, payload }),
        (response) => (response.type === 'success' ? response : null)
    );

/** Popup may not auto-close on firefox  */
const createLinkHandler = (endpoint: ClientEndpoint) => (url: string) => {
    browser.tabs
        .create({ url })
        .then(() => endpoint === 'popup' && BUILD_TARGET === 'firefox' && window.close())
        .catch(noop);
};

const createTelemetryHandler = (endpoint: ClientEndpoint) => (event: TelemetryEvent) =>
    sendMessage(
        resolveMessageFactory(endpoint)({
            type: WorkerMessageType.TELEMETRY_EVENT,
            payload: { event },
        })
    );

const openSettings = (page?: string) => {
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

const createOnboardingAck = (endpoint: ClientEndpoint) => (message: OnboardingMessage) => {
    void sendMessage(
        resolveMessageFactory(endpoint)({
            type: WorkerMessageType.ONBOARDING_ACK,
            payload: { message },
        })
    );
};

const onForceUpdate = () => browser.runtime.reload();

export const PassExtensionCore: FC<{ endpoint: ClientEndpoint }> = ({ children, endpoint }) => (
    <PassCoreProvider
        endpoint={endpoint}
        config={config}
        generateOTP={useCallback(createOTPGenerator(endpoint), [])}
        getDomainImage={getDomainImageFactory(endpoint)}
        getRatingURL={getWebStoreUrl}
        onForceUpdate={onForceUpdate}
        onLink={createLinkHandler(endpoint)}
        onOnboardingAck={createOnboardingAck(endpoint)}
        onTelemetry={useCallback(createTelemetryHandler(endpoint), [])}
        openSettings={openSettings}
        promptForPermissions={promptForPermissions}
    >
        {children}
    </PassCoreProvider>
);
