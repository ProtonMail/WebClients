import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { SidebarPrimaryButton, Tooltip } from '@proton/components';

import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props {
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ handleCompose }: Props) => {
    const { Shortcuts } = useMailModel('MailSettings');

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <Kbd shortcut="N" />
        </>
    ) : null;

    const sideBarPrimaryButton = Shortcuts ? (
        <Tooltip title={titlePrimaryButton} originalPlacement="top">
            <SidebarPrimaryButton className="hidden md:inline" onClick={handleCompose} data-testid="sidebar:compose">
                {c('Action').t`New message`}
            </SidebarPrimaryButton>
        </Tooltip>
    ) : (
        <SidebarPrimaryButton className="hidden md:inline" onClick={handleCompose} data-testid="sidebar:compose">
            {c('Action').t`New message`}
        </SidebarPrimaryButton>
    );

    return sideBarPrimaryButton;
};

export default MailSidebarPrimaryButton;
