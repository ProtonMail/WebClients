import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import OnboardingChecklistWrapper from '../checklist/OnboardingChecklistWrapper';
import EmptyView from './EmptyView';

interface Props {
    labelID: string;
    isSearch: boolean;
    isUnread: boolean;
}

const EmptyListPlaceholder = ({ labelID, isSearch, isUnread }: Props) => {
    const { displayState } = useGetStartedChecklist();

    if (displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <OnboardingChecklistWrapper />;
    }

    return <EmptyView labelID={labelID} isSearch={isSearch} isUnread={isUnread} />;
};

export default EmptyListPlaceholder;
