import { getInvalidPasswordString } from '../../../lib/auth/utils';
import { deobfuscate } from '../../../utils/obfuscate/xor';
import { passwordConfirm } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

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
