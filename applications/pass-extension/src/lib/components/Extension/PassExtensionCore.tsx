import { type FC, useCallback } from 'react';

import * as config from 'proton-pass-extension/app/config';

import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { API_PROXY_KEY } from '@proton/pass/lib/api/proxy';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { type ClientEndpoint, type Maybe, type OtpRequest, WorkerMessageType } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import noop from '@proton/utils/noop';

const getDomainImageURL = (domain?: string): Maybe<string> => {
    if (!domain) return;
    const basePath = BUILD_TARGET === 'firefox' ? config.API_URL : API_PROXY_KEY;
    return `${basePath}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
};

const createOTPGenerator = (endpoint: ClientEndpoint) => (payload: OtpRequest) =>
    sendMessage.on(
        resolveMessageFactory(endpoint)({ type: WorkerMessageType.OTP_CODE_GENERATE, payload }),
        (response) => (response.type === 'success' ? response : null)
    );

const onLink = (url: string) => browser.tabs.create({ url }).catch(noop);

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

export const PassExtensionCore: FC<{ endpoint: ClientEndpoint }> = ({ children, endpoint }) => (
    <PassCoreProvider
        config={config}
        generateOTP={useCallback(createOTPGenerator(endpoint), [])}
        getDomainImageURL={getDomainImageURL}
        onLink={onLink}
        onTelemetry={useCallback(createTelemetryHandler(endpoint), [])}
        openSettings={openSettings}
    >
        {children}
    </PassCoreProvider>
);
