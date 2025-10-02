import { useRef } from 'react';

import { c } from 'ttag';

import { Kbd, Tooltip } from '@proton/atoms';
import { Icon, SidebarPrimaryButton } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import clsx from '@proton/utils/clsx';

interface Props {
    collapsed: boolean;
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ collapsed = false, handleCompose }: Props) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [{ Shortcuts }] = useMailSettings();

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <Kbd shortcut="N" />
        </>
    ) : collapsed ? (
        c('Title').t`New message`
    ) : null;

    return (
        <Tooltip title={titlePrimaryButton} originalPlacement="top">
            <SidebarPrimaryButton
                className={clsx('hidden', collapsed ? 'px-0 md:flex' : 'md:inline')}
                onClick={handleCompose}
                data-testid="sidebar:compose"
                size={collapsed ? 'medium' : undefined}
                ref={anchorRef}
            >
                {collapsed ? (
                    <Icon name="pencil" className="flex mx-auto my-0.5" alt={c('Action').t`New message`} />
                ) : (
                    c('Action').t`New message`
                )}
            </SidebarPrimaryButton>
        </Tooltip>
    );
};

export default MailSidebarPrimaryButton;
