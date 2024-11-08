import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useLocalState } from '@proton/components';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { deleteCheckedItemsForUser } from 'proton-mail/helpers/checklist/checkedItemsStorage';

import { useOnboardingChecklistModalsContext } from './OnboardingChecklistModalProvider';

const useOnboardingChecklist = () => {
    const [user] = useUser();
    const { isModalOpened, displayModal } = useOnboardingChecklistModalsContext();
    const { changeChecklistDisplay, isChecklistFinished, userWasRewarded } = useGetStartedChecklist();
    const [rewardShowed, setRewardShowed] = useLocalState(false, `checklist-reward-showed-${user.ID}`);

    const areAllModalsClosed =
        !isModalOpened('gmailForward') &&
        !isModalOpened('protectLogin') &&
        !isModalOpened('login') &&
        !isModalOpened('mobileApps');

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
            setRewardShowed(true);
        }
    }, [isChecklistFinished, areAllModalsClosed]);

    const handleDismiss = () => {
        // Clean the session storage state
        if (isChecklistFinished) {
            deleteCheckedItemsForUser(user.ID);
        }

        const newState = isChecklistFinished ? CHECKLIST_DISPLAY_TYPE.HIDDEN : CHECKLIST_DISPLAY_TYPE.REDUCED;
        changeChecklistDisplay(newState);
    };

    return { handleDismiss };
};

export default useOnboardingChecklist;
