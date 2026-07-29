import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router';

import { conversationCountsThunk } from '@proton/mail/store/counts/conversationCountsSlice';
import { messageCountsThunk } from '@proton/mail/store/counts/messageCountsSlice';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { CacheType } from '@proton/redux-utilities/interface';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { SentryMailInitiatives, captureInitiativeMessage } from '@proton/shared/lib/helpers/sentry';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import {
    categoryIDFromUrl,
    removeCategoryFromCurrentUrl,
    setCategoryInCurrentUrl,
} from 'proton-mail/helpers/mailboxUrl';
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
    const { isCategoryViewEnabled, isCategoryViewEnabledSettled } = useCategoriesView();

    const isFirstRun = useRef(true);

    // Counts must be re-fetched when the category view setting changes and it's not the first mount
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        void dispatch(conversationCountsThunk({ cache: CacheType.None }));
        void dispatch(messageCountsThunk({ cache: CacheType.None }));
    }, [isCategoryViewEnabled, dispatch]);

    useEffect(() => {
        // Wait for all needed data to be loaded before redirecting user
        if (!isCategoryViewEnabledSettled) {
            return;
        }

        // We get the ID from the URL because the labelID in the state is not up-to-date yet.
        const { rawLabelID } = getParametersFromPath(location.pathname);
        const isInbox = !rawLabelID || rawLabelID === LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX];
        if (!isInbox) {
            return;
        }

        const categoryID = categoryIDFromUrl(location);
        if ((isCategoryViewEnabled && !categoryID) || (categoryID && disabledCategories?.includes(categoryID))) {
            dispatch(
                reset({
                    params: { labelID: MAILBOX_LABEL_IDS.INBOX },
                })
            );

            history.replace(setCategoryInCurrentUrl(location, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT));

            // Temporary tracking
            captureInitiativeMessage(
                SentryMailInitiatives.MAILBOX_REDIRECT,
                'Redirecting to default category: category view access enabled but no category in URL',
                {
                    extra: {
                        currentUrl: window.location.href,
                        categoryViewAccess: isCategoryViewEnabled,
                        categoryID,
                        disabledCategories: disabledCategories,
                    },
                }
            );

            return;
        }

        if (!isCategoryViewEnabled && categoryID) {
            dispatch(reset({ params: { labelID: MAILBOX_LABEL_IDS.INBOX } }));
            history.replace(removeCategoryFromCurrentUrl(location));

            // Temporary tracking
            captureInitiativeMessage(
                SentryMailInitiatives.MAILBOX_REDIRECT,
                'Redirecting to inbox: category view access disabled but category present in URL',
                {
                    extra: {
                        currentUrl: window.location.href,
                        categoryViewAccess: isCategoryViewEnabled,
                        categoryID,
                    },
                }
            );

            return;
        }
    }, [isCategoryViewEnabled, isCategoryViewEnabledSettled, history, dispatch, location, disabledCategories]);
};
