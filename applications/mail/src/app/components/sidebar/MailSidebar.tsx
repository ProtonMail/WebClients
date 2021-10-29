import { useCallback, memo, useContext } from 'react';
import { c } from 'ttag';
import {
    Sidebar,
    SidebarPrimaryButton,
    SidebarNav,
    MainLogo,
    useMailSettings,
    Tooltip,
    useModals,
    useUserSettings,
    Spotlight,
    useSpotlightOnFeature,
    FeatureCode,
} from '@proton/components';
import giftSvg from '@proton/styles/assets/img/get-started/gift.svg';

import { useOnCompose } from '../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../constants';
import MailGetStartedChecklistModal from '../checklist/GetStartedChecklistModal';
import MailSidebarList from './MailSidebarList';
import SidebarVersion from './SidebarVersion';
import { GetStartedChecklistContext } from '../../containers/GetStartedChecklistProvider';

interface Props {
    labelID: string;
    expanded?: boolean;
    onToggleExpand: () => void;
    onSendMessage?: () => void;
}

const MailSidebar = ({ labelID, expanded = false, onToggleExpand, onSendMessage }: Props) => {
    const onCompose = useOnCompose();
    const [userSettings] = useUserSettings();
    const { createModal } = useModals();
    const { show, onDisplayed } = useSpotlightOnFeature(FeatureCode.SpotlightGetStartedChecklist);
    const { dismissed: getStartedChecklistDismissed } = useContext(GetStartedChecklistContext);
    const handleCompose = useCallback(() => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const handleGiftClick = () => {
        createModal(
            <MailGetStartedChecklistModal
                onSendMessage={() => {
                    handleCompose();
                    onSendMessage?.();
                }}
            />
        );
    };

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <kbd className="no-border">N</kbd>
        </>
    ) : null;

    const sideBarPrimaryButton = Shortcuts ? (
        <Tooltip title={titlePrimaryButton} originalPlacement="top">
            <SidebarPrimaryButton className="no-mobile" onClick={handleCompose} data-testid="sidebar:compose">
                {c('Action').t`New message`}
            </SidebarPrimaryButton>
        </Tooltip>
    ) : (
        <SidebarPrimaryButton className="no-mobile" onClick={handleCompose} data-testid="sidebar:compose">
            {c('Action').t`New message`}
        </SidebarPrimaryButton>
    );

    return (
        <Sidebar
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={sideBarPrimaryButton}
            logo={<MainLogo to="/inbox" />}
            version={<SidebarVersion />}
            storageGift={
                userSettings.Checklists?.includes('get-started') && (
                    <Spotlight
                        content={c('Get started checklist spotlight').t`You can access the checklist anytime from here`}
                        show={getStartedChecklistDismissed && show}
                        onDisplayed={onDisplayed}
                        originalPlacement="top"
                    >
                        <button type="button" className="ml0-5" onClick={handleGiftClick}>
                            <Tooltip title={c('Storage').t`Get extra storage for free`}>
                                <img width={16} src={giftSvg} alt={c('Action').t`Open get started checklist modal`} />
                            </Tooltip>
                        </button>
                    </Spotlight>
                )
            }
        >
            <SidebarNav>
                <MailSidebarList labelID={labelID} />
            </SidebarNav>
        </Sidebar>
    );
};

export default memo(MailSidebar);
