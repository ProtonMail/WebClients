import { useCallback, memo } from 'react';
import { c } from 'ttag';
import {
    Sidebar,
    SidebarPrimaryButton,
    SidebarNav,
    MainLogo,
    useMailSettings,
    Tooltip,
    useModals,
} from '@proton/components';
import giftSvg from '@proton/styles/assets/img/get-started/gift.svg';

import { useOnCompose } from '../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../constants';
import MailGetStartedChecklistModal from '../checklist/GetStartedChecklistModal';
import MailSidebarList from './MailSidebarList';
import SidebarVersion from './SidebarVersion';

interface Props {
    labelID: string;
    expanded?: boolean;
    onToggleExpand: () => void;
}

const MailSidebar = ({ labelID, expanded = false, onToggleExpand }: Props) => {
    const onCompose = useOnCompose();
    const { createModal } = useModals();

    const handleCompose = useCallback(() => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const handleGiftClick = () => {
        createModal(<MailGetStartedChecklistModal />);
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
                <Tooltip
                    title={c('Storage').t`Get 1 GB of bonus storage for completing your "get started" action items.`}
                >
                    <button type="button" className="ml0-5" onClick={handleGiftClick}>
                        <img
                            width={16}
                            src={giftSvg}
                            alt={c('Storage gift icon img alt attribute').t`Bonus storage gift icon`}
                        />
                    </button>
                </Tooltip>
            }
        >
            <SidebarNav>
                <MailSidebarList labelID={labelID} />
            </SidebarNav>
        </Sidebar>
    );
};

export default memo(MailSidebar);
