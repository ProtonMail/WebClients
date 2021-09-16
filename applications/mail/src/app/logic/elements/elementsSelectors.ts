import { pick } from '@proton/shared/lib/helpers/object';
import { createSelector } from 'reselect';
import { PAGE_SIZE } from '../../constants';
import { hasLabel, isFilter, isUnread, sort as sortElements } from '../../helpers/elements';
import { ElementsState } from './elementsTypes';

export const selectElements = createSelector(
    (state: { elements: ElementsState }) =>
        pick(state.elements, ['elements', 'params', 'page', 'pages', 'bypassFilter']),
    ({ elements, params, page, pages, bypassFilter }) => {
        // Getting all params from the cache and not from scoped params
        // To prevent any desynchronization between cache and the output of the memo
        const { labelID, sort, filter } = params;

        const minPage = pages.reduce((acc, page) => (page < acc ? page : acc), pages[0]);
        const startIndex = (page - minPage) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const elementsArray = Object.values(elements);
        const filtered = elementsArray
            .filter((element) => hasLabel(element, labelID))
            .filter((element) => {
                if (!isFilter(filter)) {
                    return true;
                }
                if (bypassFilter.includes(element.ID || '')) {
                    return true;
                }
                const elementUnread = isUnread(element, labelID);
                return filter.Unread ? elementUnread : !elementUnread;
            });
        const sorted = sortElements(filtered, sort, labelID);

        return sorted.slice(startIndex, endIndex);
    }
);
