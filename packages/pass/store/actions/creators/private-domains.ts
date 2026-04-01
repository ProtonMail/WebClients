import { cachedRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';

export const resolvePrivateDomains = requestActionsFactory<void, boolean>('private-domains::resolved')({
    success: cachedRequest(UNIX_DAY),
});
