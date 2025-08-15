import { CacheType } from '@proton/redux-utilities';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { selectUser, userThunk } from './index';

export const userLoop: CoreEventLoopV6Callback = ({ event, state, dispatch }) => {
    if (event.Users && selectUser(state)?.value) {
        return dispatch(userThunk({ cache: CacheType.None }));
    }
};
