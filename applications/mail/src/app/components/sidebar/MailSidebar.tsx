import { memo, useCallback } from 'react';

import { AppsDropdown, MainLogo, Sidebar, SidebarContactItem, SidebarNav, useDrawer } from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { APPS } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../store/layout/layoutSliceSelectors';
import UsersOnboardingChecklist from '../checklist/UsersOnboardingChecklist';
import MailSidebarList from './MailSidebarList';
import MailSidebarPrimaryButton from './MailSidebarPrimaryButton';
import SidebarVersion from './SidebarVersion';

interface Props {
    labelID: string;
}

const MailSidebar = ({ labelID }: Props) => {
    const onCompose = useOnCompose();
    const dispatch = useMailDispatch();
    const expanded = useMailSelector(selectLayoutIsExpanded);
    const { toggleDrawerApp } = useDrawer();
    const { displayState } = useGetStartedChecklist();
    const handleCompose = useCallback(() => {
        void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);

    const logo = <MainLogo to="/inbox" data-testid="main-logo" />;

    const displayContactsInHeader = useDisplayContactsWidget();

    return (
        <>
            <Sidebar
                appsDropdown={<AppsDropdown app={APPS.PROTONMAIL} />}
                expanded={expanded}
                onToggleExpand={() => {
                    dispatch(layoutActions.toggleSidebarExpand());
                }}
                primary={<MailSidebarPrimaryButton handleCompose={handleCompose} />}
                logo={logo}
                version={<SidebarVersion />}
                contactsButton={
                    displayContactsInHeader && (
                        <SidebarContactItem
                            onClick={() => {
                                dispatch(layoutActions.setSidebarExpanded(false));
                                toggleDrawerApp({ app: DRAWER_NATIVE_APPS.CONTACTS })();
                            }}
                        />
                    )
                }
            >
                <SidebarNav className="flex">
                    <MailSidebarList labelID={labelID} />
                    {displayState === CHECKLIST_DISPLAY_TYPE.REDUCED && <UsersOnboardingChecklist smallVariant />}
                </SidebarNav>
            </Sidebar>
        </>
    );
};

export default memo(MailSidebar);
