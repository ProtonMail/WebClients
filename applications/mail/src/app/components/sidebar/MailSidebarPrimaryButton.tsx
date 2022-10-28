import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { SidebarPrimaryButton, Tooltip, useMailSettings } from '@proton/components';

interface Props {
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ handleCompose }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <Kbd shortcut="N" />
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

    return sideBarPrimaryButton;
};

export default MailSidebarPrimaryButton;
