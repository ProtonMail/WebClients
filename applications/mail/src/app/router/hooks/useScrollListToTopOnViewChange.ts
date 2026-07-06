import { useEffect } from 'react';

import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import {
    selectCategoryIDs,
    selectFilter,
    selectLabelID,
    selectPage,
    selectSearch,
    selectSort,
} from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useScrollListToTopOnViewChange = () => {
    const { scrollContainerRef } = useMailboxLayoutProvider();

    const categoryID = useMailSelector(selectCategoryIDs);
    const labelID = useMailSelector(selectLabelID);
    const search = useMailSelector(selectSearch);
    const filter = useMailSelector(selectFilter);
    const sort = useMailSelector(selectSort);
    const page = useMailSelector(selectPage);

    useEffect(() => {
        if (scrollContainerRef.current && scrollContainerRef.current.scrollTop !== 0) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [scrollContainerRef, labelID, categoryID, sort, filter, search, page]);
};
