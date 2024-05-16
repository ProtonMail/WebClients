import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import { useOpenInDocs } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    close: () => void;
}

const OpenInDocsButton = ({ shareId, link }: Props) => {
    const { openInDocsAction } = useOpenInDocs(link.mimeType);

    return (
        <ContextMenuButton
            name={c('Action').t`Open in Docs`}
            icon="file-arrow-out"
            testId="context-menu-open-in-docs"
            action={() => openInDocsAction({ shareId, linkId: link.linkId })}
            close={close}
        />
    );
};

export default OpenInDocsButton;
