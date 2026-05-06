import { type ReactNode, useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { listOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/outgoingActions';
import { SafetyReviewContainer } from '@proton/account/safetyReview/components/SafetyReviewContainer';
import type { SafetyReviewBackLink } from '@proton/account/safetyReview/components/getSafetyReviewBackLink';
import { safetyReviewSelector } from '@proton/account/safetyReview/components/safetyReviewSelector';
import { contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

export const SafetyReviewOrRedirect = ({
    backLink,
    loaderPage,
}: {
    backLink: SafetyReviewBackLink;
    loaderPage: ReactNode;
}) => {
    const dispatch = useDispatch();
    const data = useSelector(safetyReviewSelector);

    useEffect(() => {
        // Safety review require these models to be loaded (otherwise it won't be able to calculate the steps properly).
        // This is needed for when the user loads the app directly at this route without first going through settings
        // (which would have loaded them anyway).
        Promise.all([dispatch(listOutgoingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

    if (!data.isSafetyReviewAvailable) {
        return <Redirect to="/" />;
    }

    if (data.loading) {
        return loaderPage;
    }

    return <SafetyReviewContainer backLink={backLink} />;
};
