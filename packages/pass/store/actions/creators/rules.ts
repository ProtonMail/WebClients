import { cachedRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const resolveWebsiteRules = requestActionsFactory<void, boolean>('website::rules::resolve')({
    success: cachedRequest(6 * UNIX_HOUR),
});
