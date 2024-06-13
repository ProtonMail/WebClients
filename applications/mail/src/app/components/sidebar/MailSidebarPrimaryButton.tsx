import { useRef } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { SidebarPrimaryButton, Tooltip } from '@proton/components';

import ComposerAssistantSpotlight from 'proton-mail/components/assistant/spotlights/ComposerAssistantSpotlight';
import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props {
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ handleCompose }: Props) => {
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
                className="hidden md:inline"
                onClick={handleCompose}
                data-testid="sidebar:compose"
                ref={anchorRef}
            >
                {c('Action').t`New message`}
            </SidebarPrimaryButton>
        </Tooltip>
    ) : (
        <SidebarPrimaryButton
            className="hidden md:inline"
            onClick={handleCompose}
            data-testid="sidebar:compose"
            ref={anchorRef}
        >
            {c('Action').t`New message`}
        </SidebarPrimaryButton>
    );

    return <ComposerAssistantSpotlight anchorRef={anchorRef}>{sideBarPrimaryButton}</ComposerAssistantSpotlight>;
};

export default MailSidebarPrimaryButton;
