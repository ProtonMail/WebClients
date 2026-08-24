import { UNIX_DAY } from '../../../utils/time/constants';
import { cachedRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';

export const resolvePrivateDomains = requestActionsFactory<void, boolean>('private-domains::resolved')({
    success: cachedRequest(UNIX_DAY),
});
