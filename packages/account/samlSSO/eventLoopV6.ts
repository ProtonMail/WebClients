import { CacheType } from '@proton/redux-utilities';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { samlSSOThunk, selectSamlSSO } from './index';

export const samlSSOLoop: CoreEventLoopV6Callback = ({ event, state, dispatch }) => {
    if (event.Sso && selectSamlSSO(state).value) {
        return dispatch(samlSSOThunk({ cache: CacheType.None }));
    }
};
