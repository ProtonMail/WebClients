import { useCallback, memo } from 'react';
import { c } from 'ttag';
import { Sidebar, SidebarPrimaryButton, SidebarNav, MainLogo, useMailSettings, Tooltip } from '@proton/components';

import MailSidebarList from './MailSidebarList';
import SidebarVersion from './SidebarVersion';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../constants';

interface Props {
    labelID: string;
    expanded?: boolean;
    onToggleExpand: () => void;
}

const MailSidebar = ({ labelID, expanded = false, onToggleExpand }: Props) => {
    const onCompose = useOnCompose();

    const handleCompose = useCallback(() => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

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
        >
            <SidebarNav>
                <MailSidebarList labelID={labelID} />
            </SidebarNav>
        </Sidebar>
    );
};

export default memo(MailSidebar);
