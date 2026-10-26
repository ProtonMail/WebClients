import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import useLocalState from '@proton/components/hooks/useLocalState';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces/Checklist';

import { useGetStartedChecklist } from '../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { deleteCheckedItemsForUser } from '../../../helpers/checklist/checkedItemsStorage';
import { CHECKLIST_REDUCE_TRIGGERS } from '../../../telemetry/checklistEvents';
import { useChecklistTracking } from '../../../telemetry/useChecklistTracking';
import { useOnboardingChecklistModalsContext } from './OnboardingChecklistModalsProvider';

const useOnboardingChecklist = () => {
    const [user] = useUser();
    const { isModalOpened, displayModal } = useOnboardingChecklistModalsContext();
    const { changeChecklistDisplay, isChecklistFinished, userWasRewarded } = useGetStartedChecklist();
    const tracking = useChecklistTracking();
    const [rewardShowed, setRewardShowed] = useLocalState(false, `checklist-reward-showed-${user.ID}`);

    const areAllModalsClosed = !isModalOpened('protectLogin') && !isModalOpened('mobileApps');

    const canOpenStorageReward =
        // Can see storage reward modal
        isChecklistFinished &&
        !userWasRewarded &&
        !rewardShowed &&
        // All modals are closed
        areAllModalsClosed;

    useEffect(() => {
        if (canOpenStorageReward) {
            displayModal('storageReward', true);
            tracking.trackFlowFinished();
            setRewardShowed(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-78C2E3
    }, [isChecklistFinished, areAllModalsClosed]);

    const handleDismiss = () => {
        // Clean the session storage state
        if (isChecklistFinished) {
            deleteCheckedItemsForUser(user.ID);
        }

        if (isChecklistFinished) {
            changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.HIDDEN);
        } else {
            changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED, CHECKLIST_REDUCE_TRIGGERS.user);
        }
    };

    return { handleDismiss };
};

export default useOnboardingChecklist;
