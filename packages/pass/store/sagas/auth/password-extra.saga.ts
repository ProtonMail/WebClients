import { extraPasswordToggle } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: extraPasswordToggle,
    call: async (dto, options) => {
        const auth = options.getAuthService();
        if (dto.enabled) await auth.registerExtraPassword(dto.password);
        else await auth.removeExtraPassword(dto.password);

        return dto.enabled;
    },
});
