import { CacheType } from '@proton/redux-utilities';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { selectSubscription, subscriptionThunk } from './index';

export const subscriptionLoop: CoreEventLoopV6Callback = ({ event, state, dispatch }) => {
    if (event.Subscriptions && selectSubscription(state)?.value) {
        return dispatch(subscriptionThunk({ cache: CacheType.None }));
    }
};
