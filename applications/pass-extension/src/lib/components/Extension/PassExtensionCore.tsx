import { type FC, useCallback } from 'react';

import * as config from 'proton-pass-extension/app/config';

import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { API_PROXY_KEY } from '@proton/pass/lib/api/proxy';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { type ExtensionEndpoint, type Maybe, type OtpRequest, WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

const getDomainImageURL = (domain?: string): Maybe<string> => {
    if (!domain) return;
    const basePath = BUILD_TARGET === 'firefox' ? config.API_URL : API_PROXY_KEY;
    return `${basePath}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
};

const createOTPGenerator = (endpoint: ExtensionEndpoint) => (payload: OtpRequest) =>
    sendMessage.on(
        resolveMessageFactory(endpoint)({ type: WorkerMessageType.OTP_CODE_GENERATE, payload }),
        (response) => (response.type === 'success' ? response : null)
    );

const onLink = (url: string) => browser.tabs.create({ url }).catch(noop);

export const PassExtensionCore: FC<{ endpoint: ExtensionEndpoint }> = ({ children, endpoint }) => (
    <PassCoreProvider
        config={config}
        generateOTP={useCallback(createOTPGenerator(endpoint), [])}
        getDomainImageURL={getDomainImageURL}
        onLink={onLink}
    >
        {children}
    </PassCoreProvider>
);
