import { getInvalidPasswordString } from '../../../lib/auth/utils';
import { generateOfflineComponents } from '../../../lib/cache/crypto';
import { deobfuscate } from '../../../utils/obfuscate/xor';
import { offlineSetup } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: offlineSetup,
    call: async (payload, { getAuthService, getAuthStore }) => {
        const auth = getAuthService();
        const authStore = getAuthStore();

        const password = deobfuscate(payload.password, { zeroize: true });
        const verified: boolean = await auth.confirmPassword(password);
        if (!verified) throw new Error(getInvalidPasswordString(authStore));

        /** If the user does not have offline components setup on
         * the authentication store, generate the `offlineConfig`
         * `offlineKD` and persist the session immediately */
        if (!authStore.hasOfflinePassword()) {
            const components = await generateOfflineComponents(password);
            authStore.setOfflineComponents(components);
            await auth.persistSession();
        }

        return {
            extra: authStore.getExtraPassword(),
            sso: authStore.getSSO(),
            twoPwd: authStore.getTwoPasswordMode(),
        };
    },
});
