import { sendUnlockMessage } from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { NativeMessageError } from '@proton/pass/lib/native-messaging/errors';
import { createNativeMessagingService as createRootNativeMessagingService } from '@proton/pass/lib/native-messaging/native-messaging.extension';
import { NativeMessageErrorType } from '@proton/pass/types';

import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';

/** Native Messaging service
 * Implementation in the extension is a wrapper over the one living next to rest
 * of the native extension logic in packages/pass/lib/native-messaging
 * This wrapper adds the register message to list for desktop unlock request
 * from the extension ui (which is not visible from packages/pass) */
export const createNativeMessagingService = (authStore: AuthStore) => {
    const nativeMessaging = createRootNativeMessagingService();

    let unlockInProgress = false;

    WorkerMessageBroker.registerMessage(WorkerMessageType.DESKTOP_UNLOCK_SECRET, async () => {
        if (unlockInProgress) throw new NativeMessageError(NativeMessageErrorType.UNLOCK_IN_PROGRESS);
        unlockInProgress = true;
        try {
            return { secret: await sendUnlockMessage(nativeMessaging, authStore) };
        } finally {
            unlockInProgress = false;
        }
    });

    return nativeMessaging;
};
