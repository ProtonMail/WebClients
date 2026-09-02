import { useEffect } from 'react';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import StepLoadingImporter from '../StepLoading/StepLoadingImporter';
import useStepPrepareOAuth from '../StepPrepareOAuth/hooks/useStepPrepareOAuth';

/**
 * Drive only ever imports one product, so there's nothing to confirm - skip straight to the
 * loading screen instead of the generic multi-product confirm step.
 *
 * If there's an error (e.g. the Google account has no Drive), don't auto-submit: keep showing
 * the loader with a way to close it.
 */
const DriveAutoSkipPrepareStep = () => {
    const dispatch = useEasySwitchDispatch();
    const { handleSubmit, hasErrors, allCheckboxUnselected } = useStepPrepareOAuth();
    const isBlocked = hasErrors || allCheckboxUnselected;

    useEffect(() => {
        if (!isBlocked) {
            handleSubmit();
        }
    }, [isBlocked]);

    return <StepLoadingImporter onClose={isBlocked ? () => dispatch(resetOauthDraft()) : undefined} />;
};

export default DriveAutoSkipPrepareStep;
