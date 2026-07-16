import { useEffect, useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import { listOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/outgoingActions';
import { SafetyReviewContainer } from '@proton/account/safetyReview/components/SafetyReviewContainer';
import { getSafetyReviewBackLink } from '@proton/account/safetyReview/components/getSafetyReviewBackLink';
import { safetyReviewSelector } from '@proton/account/safetyReview/components/safetyReviewSelector';
import { contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import AccountLoaderPage from '../../content/AccountLoaderPage';

export const SecurityCheckup = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const data = useSelector(safetyReviewSelector);

    const [{ backLink }] = useState(() => {
        const initialSearchParams = new URLSearchParams(location.search);
        const backLink = getSafetyReviewBackLink(decodeURIComponent(initialSearchParams.get('back') ?? ''));
        return {
            backLink,
        };
    });

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
        return <AccountLoaderPage />;
    }

    return <SafetyReviewContainer backLink={backLink} />;
};
