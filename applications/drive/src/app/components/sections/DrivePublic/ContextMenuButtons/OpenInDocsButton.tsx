import { MimeIcon } from '@proton/components';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    openInDocs: (linkId: string) => void;
    linkId: string;
    mimeType: string;
    close: () => void;
}

export const OpenInDocsButton = ({ openInDocs, mimeType, linkId, close }: Props) => {
    return (
        <ContextMenuButton
            name={getOpenInDocsString(mimeType)}
            icon={<MimeIcon name="proton-doc" className="mr-2" />}
            testId="context-menu-open-in-docs"
            action={() => openInDocs(linkId)}
            close={close}
        />
    );
};
