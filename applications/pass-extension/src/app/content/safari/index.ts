import * as config from 'proton-pass-extension/app/config';

import { matchExtensionMessage } from '@proton/pass/lib/extension/message/utils';
import browser from '@proton/pass/lib/globals/browser';
import type { ApiCallFn } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import configureApi from '@proton/shared/lib/api';
import { pullForkSession } from '@proton/shared/lib/api/auth';
import { getClientID } from '@proton/shared/lib/apps/helper';
import xhr from '@proton/shared/lib/fetch/fetch';

const api = configureApi({ ...config, clientID: getClientID(config.APP_NAME), xhr } as any) as ApiCallFn;

/** In Safari, there's a known problem with cross-domain cookies in service workers.
 * As a work-around, we execute the `pullFork` request in the content script instead
 * of the service worker to ensure that cookies are properly attached. */
browser.runtime.onMessage.addListener((message: unknown, _, sendResponse: (res: any) => void) => {
    if (matchExtensionMessage(message, { sender: 'background', type: WorkerMessageType.AUTH_PULL_FORK })) {
        const pullForkParams = pullForkSession(message.payload.selector);
        pullForkParams.url = `${config.SSO_URL}/api/${pullForkParams.url}`;

        api(pullForkParams)
            .then(async (res) => sendResponse({ ok: true, ...(await res.json()) }))
            .catch((err) => sendResponse({ ok: false, error: getErrorMessage(err) }));

        return true;
    }
});
