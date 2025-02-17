import metrics from '@proton/metrics';

import { getAppHref } from '../../apps/helper';
import { APPS } from '../../constants';
import { getCurrentTab, getNewWindow } from '../../helpers/window';
import type { DriveDocsPublicShareMessage } from '../constants';
import { DriveDocsPublicShareMessageType } from '../constants';

/**
 * Timeout in `ms` for waiting for the custom password.
 */
const DRIVE_DOCS_CUSTOM_PASSWORD_TIMEOUT = 1 * 1000;

/**
 * Helper to open a new window for Docs and communicate the custom password.
 *
 * This should be used in the Drive side.
 */
export const handleDocsCustomPassword = (customPassword: string) => {
    if (!customPassword) {
        return getCurrentTab();
    }

    const w = getNewWindow();

    const onMessage = async (event: MessageEvent<DriveDocsPublicShareMessage>) => {
        if (event.source !== w.handle) {
            return;
        }

        if (event.data.type === DriveDocsPublicShareMessageType.READY_TO_RECEIVE_CUSTOM_PASSWORD) {
            w.handle.postMessage(
                {
                    type: DriveDocsPublicShareMessageType.CUSTOM_PASSWORD,
                    customPassword,
                } satisfies DriveDocsPublicShareMessage,
                getAppHref('/', APPS.PROTONDOCS)
            );

            window.removeEventListener('message', onMessage);
        }
    };

    window.addEventListener('message', onMessage);

    return w;
};

/**
 * Helper to receive the custom password from Drive.
 *
 * This should be used in the Docs side.
 */
export const receiveCustomPasswordFromDriveWindow = ({
    submitPassword,
    onFail,
}: {
    submitPassword: (customPassword: string) => Promise<void>;
    /** Callback to run when not able to receive password from drive */
    onFail: () => void;
}) => {
    const opener: Window | null = window.opener;
    if (!opener) {
        onFail();
        return;
    }

    let timeout: NodeJS.Timeout;

    const onMessage = async (event: MessageEvent<DriveDocsPublicShareMessage>) => {
        if (event.source !== opener) {
            return;
        }

        if (event.data.type === DriveDocsPublicShareMessageType.CUSTOM_PASSWORD) {
            window.removeEventListener('message', onMessage);
            clearTimeout(timeout);

            try {
                await submitPassword(event.data.customPassword);
            } catch (e) {
                onFail();

                metrics.docs_public_sharing_custom_password_success_rate_total.increment({
                    status: 'received_not_working',
                });

                return;
            }

            metrics.docs_public_sharing_custom_password_success_rate_total.increment({
                status: 'success',
            });
        }
    };

    window.addEventListener('message', onMessage);
    opener.postMessage(
        {
            type: DriveDocsPublicShareMessageType.READY_TO_RECEIVE_CUSTOM_PASSWORD,
        } satisfies DriveDocsPublicShareMessage,
        getAppHref('/', APPS.PROTONDRIVE)
    );

    timeout = setTimeout(() => {
        onFail();
        window.removeEventListener('message', onMessage);

        metrics.docs_public_sharing_custom_password_success_rate_total.increment({
            status: 'did_not_receive',
        });
    }, DRIVE_DOCS_CUSTOM_PASSWORD_TIMEOUT);
};
