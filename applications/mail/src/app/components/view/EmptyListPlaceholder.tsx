import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { taskRunningInLabel } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';

import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import UserOnboardingMessageListPlaceholder from '../onboarding/checklist/messageListPlaceholder/UserOnboardingMessageListPlaceholder';
import EmptyView from './EmptyView/EmptyView';

interface Props {
    labelID: string;
    isSearch: boolean;
    isUnread: boolean;
}

const EmptyListPlaceholder = ({ labelID, isSearch, isUnread }: Props) => {
    const { displayState, canDisplayChecklist } = useGetStartedChecklist();
    const taskIsRunningInLabel = useMailSelector((state) => taskRunningInLabel(state, { labelID }));

    if (canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <UserOnboardingMessageListPlaceholder location="emptyPlaceholder" />;
    }

    return (
        <EmptyView
            labelID={labelID}
            isSearch={isSearch}
            isUnread={isUnread}
            isTaskRunningInLabel={!!taskIsRunningInLabel}
        />
    );
};

export default EmptyListPlaceholder;
