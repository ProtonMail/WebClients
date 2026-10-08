import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { PermissionsContextValue } from '../../../../components/Core/PermissionsProvider';
import type { MaybeNull } from '../../../../types';
import { NativeMessageErrorType, type NativeMessageSetupLockSecretRequest, NativeMessageType } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { NativeMessageError } from '../../../native-messaging/errors';
import type { NativeMessagingService } from '../../../native-messaging/native-messaging.extension';
import type { AuthStore } from '../../store';

const info = (...content: any[]) => logger.info('[DesktopLock]', ...content);

/** Identifier for a lock created from this point on. The session `UID` is unique per
 * login fork, so two extensions running the same account in isolated browser contexts
 * get distinct keychain keys (unlike `LocalID`, which can collapse to the same low
 * counter across contexts — production collision, IDTEAM-5762). The `-${userID}` suffix
 * stays load-bearing: the desktop app matches on it to reject account mismatches. */
const getDesktopLockUserIdentifier = (authStore: AuthStore) => `${authStore.getUID()}-${authStore.getUserID()}`;

/** Legacy identifier format used before IDTEAM-5762. Kept solely to unlock locks created
 * under the old scheme — those have no `desktopLockUserIdentifier` persisted in session. */
const getLegacyUserIdentifier = (authStore: AuthStore) => `${authStore.getLocalID()}-${authStore.getUserID()}`;

/** The identifier baked into the keychain key at setup is persisted in the session, so
 * unlock reuses the exact same one. Absent (legacy lock) → fall back to the old format.
 * Reusing the stored value rather than re-deriving avoids a second biometric prompt that
 * a try-new-then-legacy probe would cause (the host prompts before reading the key). */
const resolveUnlockUserIdentifier = (authStore: AuthStore) => {
    const persisted = authStore.getDesktopLockUserIdentifier();
    /** Logs the label only, never the identifier value, since that embeds the UID and userID.
     * Watch this decay toward zero to decide when the legacy fallback can be dropped. */
    logger.debug('[DesktopLock]', persisted ? 'unlock: persisted identifier' : 'unlock: legacy identifier');
    return persisted ?? getLegacyUserIdentifier(authStore);
};

export const sendSetupLockSecretMessage = async (
    nativeMessaging: NativeMessagingService,
    authStore: AuthStore,
    lockSecret: string
) => {
    try {
        /** Create a request message containing a user key and a random secret to store in biometric storage */
        const userIdentifier = getDesktopLockUserIdentifier(authStore);
        const request: NativeMessageSetupLockSecretRequest = {
            type: NativeMessageType.SETUP_LOCK_SECRET,
            encrypt: true,
            lockSecret,
            userIdentifier,
        };
        info('Sending request to desktop');

        /** Encrypt, send to native messaging and decrypt response */
        const response = await nativeMessaging.sendNativeMessageRequest(request);
        info('Received response from desktop');

        /** Lock secret and user key from response must match */
        if (response.userIdentifier !== userIdentifier) {
            throw new NativeMessageError(NativeMessageErrorType.ACCOUNT_MISMATCH);
        }
        if (response.lockSecret !== lockSecret) {
            throw new NativeMessageError(NativeMessageErrorType.SETUP_LOCK_SECRET_INVALID_RESPONSE);
        }

        /** Return the identifier the secret was actually keyed under so the caller persists
         * exactly that value — unlock must resolve the same key (see resolveUnlockUserIdentifier). */
        return userIdentifier;
    } catch (error) {
        if (error instanceof NativeMessageError) throw error;
        throw new NativeMessageError(NativeMessageErrorType.UNKNOWN);
    }
};

export const sendUnlockMessage = async (nativeMessaging: NativeMessagingService, authStore: AuthStore) => {
    /** Create a request message containing the user identifier */
    const userIdentifier = resolveUnlockUserIdentifier(authStore);
    const response = await nativeMessaging.sendNativeMessageRequest({
        type: NativeMessageType.UNLOCK,
        encrypt: false,
        userIdentifier,
    });

    return response.secret;
};

export const ensureDesktopLockPermissions = async (permissions: MaybeNull<PermissionsContextValue>) => {
    try {
        if (!EXTENSION_BUILD || !permissions) throw new Error('Unsupported lock mode');
        const needsPermission = !(await permissions.hasPermission(['nativeMessaging']));

        if (needsPermission) {
            /** Granting the native messaging permission reloads the worker on Chrome (the
             * settings page where the user stands is torn down), so warn them and bail —
             * they resume after re-opening. Firefox binds the API without a reload, so the
             * copy is adapted and we proceed to create the lock in the same session. */
            const message =
                BUILD_TARGET === 'firefox'
                    ? c('Info').t`To set up biometrics unlock, ${PASS_APP_NAME} requires a new browser permission.`
                    : c('Info')
                          .t`To set up biometrics unlock, ${PASS_APP_NAME} requires a new browser permission. After you accept it, the extension will reload. Please re-open this page afterwards.`;

            await permissions.requestPermission(['nativeMessaging'], {
                title: c('Title').t`Browser permission required`,
                message,
            });

            return BUILD_TARGET === 'firefox';
        }

        return true;
    } catch {
        return false;
    }
};
