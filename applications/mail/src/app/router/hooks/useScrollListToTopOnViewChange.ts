import { useEffect } from 'react';

import { useMailboxLayoutProvider } from '../components/MailboxLayoutContext';
import {
    selectCategoryIDs,
    selectFilter,
    selectLabelID,
    selectPage,
    selectSearch,
    selectSort,
} from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';

export const useScrollListToTopOnViewChange = () => {
    const { scrollContainerRef } = useMailboxLayoutProvider();

    const categoryID = useMailSelector(selectCategoryIDs);
    const labelID = useMailSelector(selectLabelID);
    const search = useMailSelector(selectSearch);
    const filter = useMailSelector(selectFilter);
    const sort = useMailSelector(selectSort);
    const page = useMailSelector(selectPage);

    // Some reducers break the referential equality check, so we stringify the params object instead.
    const viewKey = JSON.stringify({ labelID, categoryID, sort, filter, search, page });

    useEffect(() => {
        if (scrollContainerRef.current && scrollContainerRef.current.scrollTop !== 0) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [scrollContainerRef, viewKey]);
};
