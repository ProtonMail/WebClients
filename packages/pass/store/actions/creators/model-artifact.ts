import { cachedRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import identity from '@proton/utils/identity';

export const resolveModelArtifact = requestActionsFactory<string, boolean>('model-artifact::resolve')({
    key: identity,
    success: cachedRequest(UNIX_DAY),
});
