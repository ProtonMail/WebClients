import { extraPasswordToggle } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export default createRequestSaga({
    actions: extraPasswordToggle,
    call: async (dto, options) => {
        const auth = options.getAuthService();
        const password = deobfuscate(dto.password, { zeroize: true });
        if (dto.enabled) await auth.registerExtraPassword(password);
        else await auth.removeExtraPassword(password);

        return dto.enabled;
    },
});
