import { getInvalidPasswordString } from '@proton/pass/lib/auth/utils';
import { generateOfflineComponents } from '@proton/pass/lib/cache/crypto';
import { passwordOnLaunchToggle } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export default createRequestSaga({
    actions: passwordOnLaunchToggle,
    /** `lockPasswordOnLaunch` lives in the protected auth session.
     * Enabling ensures offline password material exists for launch unlocks. */
    call: async ({ enabled, password: passwordBuff }, { getAuthService, getAuthStore }) => {
        const auth = getAuthService();
        const authStore = getAuthStore();

        const password = deobfuscate(passwordBuff, { zeroize: true });
        const previous = authStore.getLockPasswordOnLaunch();
        const verified = await auth.confirmPassword(password);
        if (!verified) throw new Error(getInvalidPasswordString(authStore));

        if (enabled && !authStore.hasOfflinePassword()) {
            const components = await generateOfflineComponents(password);
            authStore.setOfflineComponents(components);
        }

        authStore.setLockPasswordOnLaunch(enabled);

        try {
            await auth.persistSession({
                throwOnFailure: true,
            });
        } catch (error) {
            authStore.setLockPasswordOnLaunch(previous);
            throw error;
        }

        return enabled;
    },
});
