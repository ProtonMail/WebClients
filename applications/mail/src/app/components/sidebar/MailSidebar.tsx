import { memo, useCallback } from 'react';

import { AppsDropdown, MainLogo, Sidebar, SidebarDrawerItems, SidebarNav } from '@proton/components';
import SidebarStorageUpsell from '@proton/components/containers/payments/subscription/SidebarStorageUpsell';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { APPS } from '@proton/shared/lib/constants';
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
    const { displayState, canDisplayChecklist } = useGetStartedChecklist();
    const handleCompose = useCallback(() => {
        void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);

    const logo = <MainLogo to="/inbox" data-testid="main-logo" />;

    const displayContactsInHeader = useDisplayContactsWidget();

    return (
        <Sidebar
            app={APPS.PROTONMAIL}
            appsDropdown={<AppsDropdown app={APPS.PROTONMAIL} />}
            expanded={expanded}
            onToggleExpand={() => {
                dispatch(layoutActions.toggleSidebarExpand());
            }}
            primary={<MailSidebarPrimaryButton handleCompose={handleCompose} />}
            logo={logo}
            version={<SidebarVersion />}
            preFooter={<SidebarStorageUpsell app={APPS.PROTONMAIL} />}
        >
            <SidebarNav className="flex">
                <MailSidebarList
                    labelID={labelID}
                    postItems={
                        displayContactsInHeader && (
                            <SidebarDrawerItems
                                toggleHeaderDropdown={() => {
                                    dispatch(layoutActions.setSidebarExpanded(false));
                                }}
                            />
                        )
                    }
                />

                {canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.REDUCED && (
                    <UsersOnboardingChecklist smallVariant />
                )}
            </SidebarNav>
        </Sidebar>
    );
};

export default memo(MailSidebar);
