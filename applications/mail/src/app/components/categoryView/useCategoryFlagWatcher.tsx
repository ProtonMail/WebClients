import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router';

import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { categoryIDFromUrl, setCategoryInUrl } from 'proton-mail/helpers/mailboxUrl';
import { getParametersFromPath } from 'proton-mail/hooks/mailbox/useElements';
import { reset } from 'proton-mail/store/elements/elementsActions';
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
    const disabledCategories = useMailSelector(selectDisabledCategoriesIDs);

    const dispatch = useMailDispatch();

    const categoryView = useCategoriesView();

    // We get the ID from the URL because the labelID in the state is not up-to-date yet.
    useEffect(() => {
        const { rawLabelID } = getParametersFromPath(location.pathname);
        const isInbox = !rawLabelID || rawLabelID === LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX];
        if (!isInbox) {
            return;
        }

        const categoryID = categoryIDFromUrl(location);
        if (
            (categoryView.categoryViewAccess && !categoryID) ||
            (categoryID && disabledCategories?.includes(categoryID))
        ) {
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
    }, [categoryView.categoryViewAccess, history, dispatch, location, disabledCategories]);
};
