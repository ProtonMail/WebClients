import identity from '@proton/utils/identity';

import { UNIX_DAY } from '../../../utils/time/constants';
import { cachedRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';

export const resolveModelArtifact = requestActionsFactory<string, boolean>('model-artifact::resolve')({
    key: identity,
    success: cachedRequest(UNIX_DAY),
});
