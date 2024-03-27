import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { ContextMenuButton } from '../../sections/ContextMenu';

interface Props {
    volumeId: string;
    linkId: string;
    invitationId: string;
    close: () => void;
}

const CopyShareInvitationLinkButton = ({ volumeId, linkId, invitationId, close }: Props) => {
    const { createNotification } = useNotifications();

    const copyShareInviteLinkUrl = () => {
        textToClipboard(getStaticURL(`/${volumeId}/${linkId}?invitation=${invitationId}`));
        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    };
    return (
        <ContextMenuButton
            name={c('Action').t`Copy invite link`}
            icon="link"
            testId="context-menu-sharing-copy-link"
            action={copyShareInviteLinkUrl}
            close={close}
        />
    );
};

export default CopyShareInvitationLinkButton;
