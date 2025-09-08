import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { useCategoriesView } from './useCategoriesView';

export const useMailCategoriesRedirection = () => {
    const location = useLocation();
    const { push } = useHistory();
    const categoryViewControl = useCategoriesView();

    useEffect(() => {
        if (
            categoryViewControl.categoryViewAccess &&
            location.pathname.includes(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX])
        ) {
            push(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]);
        }
    }, [location.pathname, categoryViewControl.categoryViewAccess, push]);
};
