import { c } from 'ttag';

import { passwordConfirm } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: passwordConfirm,
    call: async ({ password, mode }, options) => {
        const auth = options.getAuthService();
        const verified = await auth.confirmPassword(password, mode);

        if (!verified) {
            const message = options.getAuthStore().getExtraPassword()
                ? c('Error').t`Wrong extra password`
                : c('Error').t`Wrong password`;
            throw new Error(message);
        }

        return true;
    },
});
