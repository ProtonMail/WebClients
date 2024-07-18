import { useRef } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, SidebarPrimaryButton, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props {
    collapsed: boolean;
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ collapsed = false, handleCompose }: Props) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
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
            <SidebarPrimaryButton
                className={clsx('hidden md:inline', collapsed && 'px-0')}
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
    ) : (
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
    );

    return sideBarPrimaryButton;
};

export default MailSidebarPrimaryButton;
