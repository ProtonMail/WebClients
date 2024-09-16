import { type FC, useEffect } from 'react';

import { SSO_URL } from 'proton-pass-extension/app/config';

import { CircleLoader } from '@proton/atoms';
import { pageMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import { WorkerMessageType } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

/* By-pass SSL error on browser start-up when working with staging.
 * In the startup event listener - when the extension's target API
 * is set to staging - there seems to be an error during the initial SSL
 * handshake (net:ERR_SSL_CLIENT_AUTH_CERT_NEEDED) */
const bypass = async () => {
    const tab = await browser.tabs.getCurrent().catch(noop);
    const tabId = tab?.id;

    if (!tab || !tabId) return;

    try {
        await wait(500);
        await fetch(SSO_URL);
        await sendMessage(
            pageMessage({
                type: WorkerMessageType.AUTH_INIT,
                options: { retryable: true },
            })
        );
    } finally {
        void browser.tabs.remove(tabId);
    }
};

export const ResumeSession: FC = () => {
    useEffect(() => {
        void bypass();
    }, []);

    return (
        <div className="pass-lobby flex" style={{ height: '100vh' }}>
            <main className="w-full max-w-custom relative flex m-auto rounded-lg" style={{ '--max-w-custom': '30rem' }}>
                <div className="flex p-14 w-full flex-column items-center gap-4">
                    <h3 className="">Signing you back in</h3>
                    <CircleLoader size="large" className="color-primary" />
                    <em>Don't close this tab</em>
                </div>
            </main>
        </div>
    );
};
