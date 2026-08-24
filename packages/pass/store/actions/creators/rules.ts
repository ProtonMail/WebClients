import { UNIX_HOUR } from '../../../utils/time/constants';
import { cachedRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';

export const resolveWebsiteRules = requestActionsFactory<void, boolean>('website::rules::resolve')({
    success: cachedRequest(6 * UNIX_HOUR),
});
