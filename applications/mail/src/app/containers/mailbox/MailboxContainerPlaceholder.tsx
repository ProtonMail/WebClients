import { Cancellable } from '@proton/components/hooks/useHandler';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import OnboardingChecklistWrapper from '../../components/checklist/OnboardingChecklistWrapper';
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
    const { loading: loadingChecklist, displayState } = useGetStartedChecklist();

    if (loadingChecklist) {
        return null;
    }

    if (showPlaceholder && displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <OnboardingChecklistWrapper />;
    }

    if (showPlaceholder) {
        return (
            <PlaceholderView
                welcomeFlag={welcomeFlag}
                labelID={labelID}
                checkedIDs={checkedIDs}
                onCheckAll={handleCheckAll}
            />
        );
    }

    return null;
};

export default MailboxContainerPlaceholder;
