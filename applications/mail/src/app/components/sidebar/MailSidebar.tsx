import { memo, useCallback } from 'react';

import { AppsDropdown, MainLogo, Sidebar, SidebarNav } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import OnboardingChecklistWrapper from '../checklist/OnboardingChecklistWrapper';
import MailSidebarList from './MailSidebarList';
import MailSidebarPrimaryButton from './MailSidebarPrimaryButton';
import SidebarVersion from './SidebarVersion';

interface Props {
    labelID: string;
    expanded?: boolean;
    onToggleExpand: () => void;
}

const MailSidebar = ({ labelID, expanded = false, onToggleExpand }: Props) => {
    const onCompose = useOnCompose();
    const { displayState } = useGetStartedChecklist();
    const handleCompose = useCallback(() => {
        onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);

    const logo = <MainLogo to="/inbox" data-testid="main-logo" />;

    return (
        <>
            <Sidebar
                appsDropdown={<AppsDropdown app={APPS.PROTONMAIL} />}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                primary={<MailSidebarPrimaryButton handleCompose={handleCompose} />}
                logo={logo}
                version={<SidebarVersion />}
            >
                <SidebarNav className="flex">
                    <MailSidebarList labelID={labelID} />
                    {displayState === CHECKLIST_DISPLAY_TYPE.REDUCED && <OnboardingChecklistWrapper smallVariant />}
                </SidebarNav>
            </Sidebar>
        </>
    );
};

export default memo(MailSidebar);
