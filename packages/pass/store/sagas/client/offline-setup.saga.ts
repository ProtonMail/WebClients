import { getInvalidPasswordString } from '@proton/pass/lib/auth/utils';
import { type OfflineComponents, generateOfflineComponents } from '@proton/pass/lib/cache/crypto';
import { offlineSetup } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: offlineSetup,
    call: async ({ password }, { getAuthService, getAuthStore }) => {
        const auth = getAuthService();
        const authStore = getAuthStore();

        const verified: boolean = await auth.confirmPassword(password);
        if (!verified) throw new Error(getInvalidPasswordString(authStore));

        /** If the user does not have offline components setup on
         * the authentication store, generate the `offlineConfig`
         * `offlineKD` and persist the session immediately */
        if (!authStore.hasOfflinePassword()) {
            const data: OfflineComponents = await generateOfflineComponents(password);
            authStore.setOfflineConfig(data.offlineConfig);
            authStore.setOfflineKD(data.offlineKD);
            authStore.setOfflineVerifier(data.offlineVerifier);
            await auth.persistSession();
        }

        return {
            extra: authStore.getExtraPassword(),
            sso: authStore.getSSO(),
            twoPwd: authStore.getTwoPasswordMode(),
        };
    },
});
