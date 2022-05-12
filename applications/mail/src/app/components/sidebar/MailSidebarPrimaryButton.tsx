import { SidebarPrimaryButton, Tooltip, useMailSettings } from '@proton/components';
import { c } from 'ttag';

interface Props {
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ handleCompose }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <kbd className="border-none">N</kbd>
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
