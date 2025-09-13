import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';

interface Props {
    publicLinkUrl: string;
    close: () => void;
}

export const CopyLinkContextButton = ({ publicLinkUrl, close }: Props) => {
    const { createNotification } = useNotifications();

    const handleCopyURLClick = () => {
        textToClipboard(publicLinkUrl);
        createNotification({
            text: c('Success').t`Secure link copied`,
        });
    };

    return (
        <ContextMenuButton
            name={c('Action').t`Copy link`}
            icon="link"
            testId="context-menu-copy-link"
            action={handleCopyURLClick}
            close={close}
        />
    );
};
