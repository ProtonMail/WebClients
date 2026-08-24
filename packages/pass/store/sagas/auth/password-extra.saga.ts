import { deobfuscate } from '../../../utils/obfuscate/xor';
import { extraPasswordToggle } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

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
