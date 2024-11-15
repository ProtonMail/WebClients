import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    openPreview: (item: DecryptedLink) => void;
    link: DecryptedLink;
    close: () => void;
}

export const PreviewButton = ({ openPreview, link, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => openPreview(link)}
            close={close}
        />
    );
};
