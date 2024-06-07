import { useRef } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, SidebarPrimaryButton, Tooltip } from '@proton/components';
import { useAssistant } from '@proton/llm/lib';
import clsx from '@proton/utils/clsx';

import ComposerAssistantSpotlight from 'proton-mail/components/assistant/spotlights/ComposerAssistantSpotlight';
import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props {
    handleCompose: () => void;
}

const MailSidebarPrimaryButton = ({ handleCompose }: Props) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const { Shortcuts } = useMailModel('MailSettings');

    const { canShowAssistant } = useAssistant();

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
                className={clsx(['hidden md:inline', canShowAssistant && 'relative px-3'])}
                onClick={handleCompose}
                data-testid="sidebar:compose"
                ref={anchorRef}
            >
                {c('Action').t`New message`}{' '}
                {canShowAssistant && <Icon name="pen-sparks" className="absolute right-0 mr-2 inset-y-center" />}
            </SidebarPrimaryButton>
        </Tooltip>
    ) : (
        <SidebarPrimaryButton
            className={clsx(['hidden md:inline', canShowAssistant && 'relative px-3'])}
            onClick={handleCompose}
            data-testid="sidebar:compose"
            ref={anchorRef}
        >
            {c('Action').t`New message`}{' '}
            {canShowAssistant && <Icon name="pen-sparks" className="absolute right-0 mr-2 inset-y-center" />}
        </SidebarPrimaryButton>
    );

    return <ComposerAssistantSpotlight anchorRef={anchorRef}>{sideBarPrimaryButton}</ComposerAssistantSpotlight>;
};

export default MailSidebarPrimaryButton;
