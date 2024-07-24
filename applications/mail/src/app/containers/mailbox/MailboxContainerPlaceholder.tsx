import type { Cancellable } from '@proton/components/hooks/useHandler';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import TipBox from 'proton-mail/components/list/tip/TipBox';
import useTips from 'proton-mail/components/list/tip/useTips';

import UsersOnboardingChecklist from '../../components/checklist/UsersOnboardingChecklist';
import PlaceholderView from '../../components/view/PlaceholderView';
import { useGetStartedChecklist } from '../onboardingChecklist/provider/GetStartedChecklistProvider';

interface Props {
    showPlaceholder: boolean;
    welcomeFlag: boolean;
    labelID: string;
    checkedIDs: string[];
    handleCheckAll: ((check: boolean) => void) & Cancellable;
}

const MailboxContainerPlaceholder = ({ showPlaceholder, welcomeFlag, labelID, checkedIDs, handleCheckAll }: Props) => {
    const { loading: loadingChecklist, displayState, canDisplayChecklist } = useGetStartedChecklist();
    const { tips, isTipDismissed, setIsTipDismissed, shouldDisplayTips } = useTips();

    if (loadingChecklist) {
        return null;
    }

    if (showPlaceholder && canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <UsersOnboardingChecklist />;
    }

    if (showPlaceholder) {
        return (
            <>
                <PlaceholderView
                    welcomeFlag={welcomeFlag}
                    labelID={labelID}
                    checkedIDs={checkedIDs}
                    onCheckAll={handleCheckAll}
                />
                {shouldDisplayTips && tips.length && (
                    <TipBox tips={tips} isDismissed={isTipDismissed} setIsDismissed={setIsTipDismissed} />
                )}
            </>
        );
    }

    return null;
};

export default MailboxContainerPlaceholder;
