import { cachedRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const resolveModelRegistry = requestActionsFactory<void, boolean>('model-registry::resolve')({
    success: cachedRequest(UNIX_HOUR),
});
