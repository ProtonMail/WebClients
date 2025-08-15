import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { domainsEventLoopV6Thunk, selectDomains } from './index';

export const domainsLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Domains?.length && selectDomains(state)?.value) {
        return dispatch(domainsEventLoopV6Thunk({ event, api }));
    }
};
