import type { MailEventLoopV6Callback } from '../mailEventLoop/interface';
import { categoriesEventLoopV6Thunk, selectCategories } from './index';

export const labelsLoop: MailEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Labels?.length && selectCategories(state)?.value) {
        return dispatch(categoriesEventLoopV6Thunk({ event, api }));
    }
};
