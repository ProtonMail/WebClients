import { type ReactNode, useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import useConfig from '@proton/components/hooks/useConfig';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import { useLoadRecoveryState } from '../recoveryState/useRecoveryState';
import { SafetyReviewContainer } from './SafetyReviewContainer';
import { getSafetyReviewBackLink } from './getSafetyReviewBackLink';
import { safetyReviewSelector } from './safetyReviewSelector';

interface Props {
    /** App specific loader, displayed while the models the review depends on are loading. */
    loader: ReactNode;
}

/**
 * Route entry point for the safety review. Meant to be mounted outside of the settings layout so that the review
 * gets the full page to itself.
 */
export const SafetyReviewRoute = ({ loader }: Props) => {
    const location = useLocation();
    const { APP_NAME } = useConfig();
    const data = useSelector(safetyReviewSelector);

    const [{ backLink }] = useState(() => {
        const initialSearchParams = new URLSearchParams(location.search);
        const backLink = getSafetyReviewBackLink(decodeURIComponent(initialSearchParams.get('back') ?? ''), APP_NAME);
        return {
            backLink,
        };
    });

    // Safety review require these models to be loaded (otherwise it won't be able to calculate the steps properly).
    // This is needed for when the user loads the app directly at this route without first going through settings
    // (which would have loaded them anyway).
    useLoadRecoveryState();

    if (!data.isSafetyReviewAvailable) {
        return <Redirect to="/" />;
    }

    if (data.loading) {
        return <>{loader}</>;
    }

    return <SafetyReviewContainer backLink={backLink} />;
};
