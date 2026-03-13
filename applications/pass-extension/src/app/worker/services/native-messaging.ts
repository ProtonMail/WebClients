import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { sendUnlockMessage } from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createNativeMessagingService as createRootNativeMessagingService } from '@proton/pass/lib/native-messaging/native-messaging.extension';

/** Native Messaging service
 * Implementation in the extension is a wrapper over the one living next to rest
 * of the native extension logic in packages/pass/lib/native-messaging
 * This wrapper adds the register message to list for desktop unlock request
 * from the extension ui (which is not visible from packages/pass) */
export const createNativeMessagingService = (authStore: AuthStore) => {
    const nativeMessaging = createRootNativeMessagingService();

    WorkerMessageBroker.registerMessage(WorkerMessageType.DESKTOP_UNLOCK_SECRET, async () => ({
        secret: await sendUnlockMessage(nativeMessaging, authStore),
    }));

    return nativeMessaging;
};
