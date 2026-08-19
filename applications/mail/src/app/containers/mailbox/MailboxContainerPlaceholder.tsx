import type { Cancellable } from '@proton/components/hooks/useHandler';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import TipBox from '../../components/list/tip/TipBox';
import useTips from '../../components/list/tip/useTips';
import UserOnboardingMessageListPlaceholder from '../../components/onboarding/checklist/messageListPlaceholder/UserOnboardingMessageListPlaceholder';

import PlaceholderView from '../../components/view/PlaceholderView';
import { useGetStartedChecklist } from '../onboardingChecklist/provider/GetStartedChecklistProvider';

interface Props {
    showPlaceholder: boolean;
    welcomeFlag: boolean;
    checkedIDs: string[];
    handleCheckAll: ((check: boolean) => void) & Cancellable;
}

const MailboxContainerPlaceholder = ({ showPlaceholder, welcomeFlag, checkedIDs, handleCheckAll }: Props) => {
    const { loading: loadingChecklist, displayState, canDisplayChecklist } = useGetStartedChecklist();
    const { tips, isTipDismissed, setIsTipDismissed, shouldDisplayTips } = useTips();

    if (loadingChecklist) {
        return null;
    }

    if (showPlaceholder && canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <UserOnboardingMessageListPlaceholder location="mailboxContainerPlaceholder" />;
    }

    if (showPlaceholder) {
        return (
            <>
                <PlaceholderView welcomeFlag={welcomeFlag} checkedIDs={checkedIDs} onCheckAll={handleCheckAll} />
                {shouldDisplayTips && tips.length > 0 && (
                    <TipBox tips={tips} isDismissed={isTipDismissed} setIsDismissed={setIsTipDismissed} />
                )}
            </>
        );
    }

    return null;
};

export default MailboxContainerPlaceholder;
