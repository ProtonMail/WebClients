import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { useCategoriesView } from './useCategoriesView';

interface Props {
    labelID: string;
}

export const useMailCategoriesRedirection = ({ labelID }: Props) => {
    const location = useLocation();
    const { push } = useHistory();
    const { activeCategoriesTabs, categoryViewAccess } = useCategoriesView();

    useEffect(() => {
        if (categoryViewAccess && location.pathname.includes(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX])) {
            push(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]);
        }

        const currentCategory = activeCategoriesTabs.find((cat) => cat.id === labelID);
        if (categoryViewAccess && currentCategory && !currentCategory.display) {
            push(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]);
        }
    }, [location.pathname, categoryViewAccess, activeCategoriesTabs, push, labelID]);
};
