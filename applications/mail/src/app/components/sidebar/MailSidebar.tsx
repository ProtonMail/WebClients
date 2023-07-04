import { memo, useCallback } from 'react';

import { AppsDropdown, MainLogo, Sidebar, SidebarContactItem, SidebarNav, useDrawer } from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { APPS } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../logic/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../logic/layout/layoutSliceSelectors';
import { useAppDispatch, useAppSelector } from '../../logic/store';
import UsersOnboardingChecklist from '../checklist/UsersOnboardingChecklist';
import MailSidebarDriveSpotlight from './MailSidebarDriveSpotlight';
import MailSidebarList from './MailSidebarList';
import MailSidebarPrimaryButton from './MailSidebarPrimaryButton';
import SidebarVersion from './SidebarVersion';

interface Props {
    labelID: string;
}

const MailSidebar = ({ labelID }: Props) => {
    const onCompose = useOnCompose();
    const dispatch = useAppDispatch();
    const expanded = useAppSelector(selectLayoutIsExpanded);
    const { toggleDrawerApp } = useDrawer();
    const { displayState } = useGetStartedChecklist();
    const handleCompose = useCallback(() => {
        onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);

    const logo = <MainLogo to="/inbox" data-testid="main-logo" />;

    const displayContactsInHeader = useDisplayContactsWidget();

    return (
        <>
            <Sidebar
                appsDropdown={
                    <MailSidebarDriveSpotlight
                        renderDropdown={(hideSpotlight) => (
                            <AppsDropdown app={APPS.PROTONMAIL} onDropdownClick={hideSpotlight} />
                        )}
                    />
                }
                expanded={expanded}
                onToggleExpand={() => {
                    dispatch(layoutActions.toggleExpanded());
                }}
                primary={<MailSidebarPrimaryButton handleCompose={handleCompose} />}
                logo={logo}
                version={<SidebarVersion />}
                contactsButton={
                    displayContactsInHeader && (
                        <SidebarContactItem
                            onClick={() => {
                                dispatch(layoutActions.setExpanded(false));
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
