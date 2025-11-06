import { useRef } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { SidebarPrimaryButton } from '@proton/components';
import { IcPencil } from '@proton/icons/icons/IcPencil';
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
                    <IcPencil className="flex mx-auto my-0.5" alt={c('Action').t`New message`} />
                ) : (
                    c('Action').t`New message`
                )}
            </SidebarPrimaryButton>
        </Tooltip>
    );
};

export default MailSidebarPrimaryButton;
