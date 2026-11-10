import noop from '@proton/utils/noop';

import type { PassCoreContextValue } from '../../../../components/Core/PassCoreProvider';
import { logger } from '../../../../utils/logger';
import type { AuthService } from '../../service';

/** Deletes the biometric key material at rest on platforms where the OS store cannot
 * be bound to the requesting app (Windows): the `encryptedOfflineKD` envelope and the
 * OS-held secret it points at. Only locks created before the app-unbound model carry
 * one. The lock mode is left untouched: Windows Hello stays as a UI lock, while a
 * reboot goes through the standard paths — Hello prompt online, password prompt on
 * offline boot (the password-derived offline components are kept, so the offline
 * unlock never dead-ends).
 *
 * The envelope lives outside the encrypted session blob and is absent from the
 * integrity digest keys, so it is cleared through `syncPersistedSession` (field merge
 * without re-encryption): at this point the `clientKey` is not necessarily
 * available — notably on an offline boot, where a full `persistSession` would fail.
 *
 * Only called once the user has proven they can get back in without it: a resumed
 * session, or a password unlock. Until then the envelope stays persisted, unused (the
 * unlock paths key on `biometricsKeyAppBound`, never on its presence), so a user who
 * forgot their password and whose session is gone is not locked out by the update.
 *
 * Detects the envelope itself rather than a persisted flag, making the operation
 * idempotent: a failed persistence leaves the envelope in the persisted session, and
 * the next proof deletes it again. */
export const deleteBiometricsKeyIfNotAppBound = async (
    auth: AuthService,
    core: PassCoreContextValue
): Promise<boolean> => {
    if (core.biometricsKeyAppBound) return false;

    const { authStore } = auth.config;
    const encryptedOfflineKD = authStore.getEncryptedOfflineKD();
    if (!encryptedOfflineKD) return false;

    logger.info('[BiometricLock] Deleting biometric key material at rest (key not app-bound)');

    /** Best effort: an orphaned OS-held secret is inert once the envelope is gone.
     * Fails on a missing entry (already deleted) or a bridge error. */
    await core
        .removeBiometricsKey?.(authStore)
        .catch((err) => logger.warn('[BiometricLock] Could not remove the OS-held biometric key', err));

    authStore.setEncryptedOfflineKD(undefined);
    authStore.setUnlockRetryCount(0);
    /** Swallowed on purpose: this runs inside the auth flow, and the in-memory
     * deletion above already applies. A failed write leaves the envelope
     * persisted, so the next proof deletes it again. */
    await auth
        .syncPersistedSession(authStore.getLocalID(), { encryptedOfflineKD: undefined, unlockRetryCount: 0 })
        .catch(noop);

    return true;
};
