import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import UsersOnboardingChecklist from '../checklist/UsersOnboardingChecklist';
import EmptyView from './EmptyView';

interface Props {
    labelID: string;
    isSearch: boolean;
    isUnread: boolean;
}

const EmptyListPlaceholder = ({ labelID, isSearch, isUnread }: Props) => {
    const { displayState } = useGetStartedChecklist();

    if (displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <UsersOnboardingChecklist />;
    }

    return <EmptyView labelID={labelID} isSearch={isSearch} isUnread={isUnread} />;
};

export default EmptyListPlaceholder;
