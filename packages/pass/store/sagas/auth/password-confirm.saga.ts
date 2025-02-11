import { getInvalidPasswordString } from '@proton/pass/lib/auth/utils';
import { passwordConfirm } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: passwordConfirm,
    call: async ({ password, mode }, options) => {
        const auth = options.getAuthService();
        const authStore = options.getAuthStore();

        const verified = await auth.confirmPassword(password, mode);
        if (!verified) throw new Error(getInvalidPasswordString(authStore));

        return true;
    },
});
