import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { categoryIDFromUrl, setCategoryInUrl } from 'proton-mail/helpers/mailboxUrl';
import { reset } from 'proton-mail/store/elements/elementsActions';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { useCategoriesView } from './useCategoriesView';

/**
 * Keeps the URL consistent with the user's category view access when it changes mid-session.
 * Prevents a hard-refresh from the user.
 *
 * When category view becomes accessible, the inbox URL must include the default category for the view to render correct emails.
 * When access is lost (either feature flag or setting), any lingering category hash must be removed.
 */
export const useCategoryFlagWatcher = () => {
    const history = useHistory();
    const location = useLocation();
    const labelID = useMailSelector(selectLabelID);

    const dispatch = useMailDispatch();

    const categoryView = useCategoriesView();

    useEffect(() => {
        if (labelID !== MAILBOX_LABEL_IDS.INBOX) {
            return;
        }

        const categoryID = categoryIDFromUrl(location);
        if (categoryView.categoryViewAccess && !categoryID) {
            const newUrl = setCategoryInUrl(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
            dispatch(
                reset({
                    params: { labelID: MAILBOX_LABEL_IDS.INBOX },
                })
            );
            history.replace(newUrl);
            return;
        }

        if (!categoryView.categoryViewAccess && categoryID) {
            dispatch(reset({ params: { labelID: MAILBOX_LABEL_IDS.INBOX } }));
            history.replace(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`);
            return;
        }
    }, [categoryView.categoryViewAccess, labelID, history, dispatch, location]);
};
