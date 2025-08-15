import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { addressesEventLoopV6Thunk, selectAddresses } from './index';

export const addressesLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Addresses?.length && selectAddresses(state)?.value) {
        return dispatch(addressesEventLoopV6Thunk({ event, api }));
    }
};
