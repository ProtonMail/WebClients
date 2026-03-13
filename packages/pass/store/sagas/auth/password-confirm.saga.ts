import { getInvalidPasswordString } from '@proton/pass/lib/auth/utils';
import { passwordConfirm } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export default createRequestSaga({
    actions: passwordConfirm,
    call: async (dto, options) => {
        const auth = options.getAuthService();
        const authStore = options.getAuthStore();

        const password = deobfuscate(dto.password, { zeroize: true });
        const verified = await auth.confirmPassword(password, dto.mode);
        if (!verified) throw new Error(getInvalidPasswordString(authStore));

        return true;
    },
});
