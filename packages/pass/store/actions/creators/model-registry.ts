import { UNIX_HOUR } from '../../../utils/time/constants';
import { cachedRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';

export const resolveModelRegistry = requestActionsFactory<void, boolean>('model-registry::resolve')({
    success: cachedRequest(UNIX_HOUR),
});
