import { getAppHref } from '../../apps/helper';
import { APPS } from '../../constants';
import type { WindowHandle } from '../../helpers/window';
import { getNewWindow } from '../../helpers/window';

type UrlPasswordFromDocsClientMessageData = {
    payload: {
        token: string;
        urlPassword: string;
        customPassword?: string;
    };
    type: 'url-password-from-docs-client';
};

/** Message sent from Drive to Docs informing Docs it is ready to receive the urlPassword and customPassword */
type DriveClientReadyMessage = {
    type: 'drive-client-ready-for-url-password';
    payload: {
        token: string;
    };
};

/**
 * When bookmarking flow initiates from Docs client, a new Drive tab will eventually be opened after auth.
 * Drive client will see that it doesn't have a urlPassword available and will wait to see if Docs sends it.
 * Drive client will start by initiating a postMessage to Docs client letting it know it's ready to receive the urlPassword.
 * Docs client will then send the urlPassword via postMessage.
 *
 * This function should be used on the Docs side.
 */
export const waitForBookmarkingMessageFromDriveClient = (
    token: string,
    urlPassword: string,
    onCompletion: () => void
): WindowHandle => {
    const w = getNewWindow();

    const messageHandler = (event: MessageEvent<any>) => {
        if (event.source !== w.handle) {
            return;
        }

        const message: DriveClientReadyMessage = event.data;
        if (message.type === 'drive-client-ready-for-url-password') {
            if (message.payload.token !== token) {
                return;
            }

            const reply: UrlPasswordFromDocsClientMessageData = {
                type: 'url-password-from-docs-client',
                payload: {
                    urlPassword,
                    token,
                },
            };

            w.handle.postMessage(reply, getAppHref('/', APPS.PROTONDRIVE));

            window.removeEventListener('message', messageHandler);
            onCompletion();
        }
    };

    window.addEventListener('message', messageHandler);

    return w;
};

/**
/**
 * Docs sends the urlPassword via postMessage
 *
 * This should be used in the Drive side.
 */
export const waitForUrlPasswordFromDocsClient = (
    token: string,
    callback: (data: UrlPasswordFromDocsClientMessageData['payload']) => void
) => {
    if (!window.opener) {
        // eslint-disable-next-line no-console
        console.error('Attempting docs bookmarking flow with no window.opener found');
        return;
    }

    const handleMessageFromDocsClient = async (event: MessageEvent<any>) => {
        const data = event.data as UrlPasswordFromDocsClientMessageData;
        if (data.type === 'url-password-from-docs-client') {
            callback(data.payload);
            window.removeEventListener('message', handleMessageFromDocsClient);
        }
    };

    const message: DriveClientReadyMessage = {
        type: 'drive-client-ready-for-url-password',
        payload: {
            token,
        },
    };

    window.addEventListener('message', handleMessageFromDocsClient);
    window.opener.postMessage(message, getAppHref('/', APPS.PROTONDOCS));
};
