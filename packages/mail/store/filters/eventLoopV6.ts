import type { MailEventLoopV6Callback } from '../mailEventLoop/interface';
import { filtersEventLoopV6Thunk, selectFilters } from './index';

export const filtersLoop: MailEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Filters?.length && selectFilters(state)?.value) {
        return dispatch(filtersEventLoopV6Thunk({ event, api }));
    }
};
