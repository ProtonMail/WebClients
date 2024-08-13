import { MimeIcon } from '@proton/components/components';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import type { DecryptedLink } from '../../../../store';
import { useOpenInDocs } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    close: () => void;
}

const OpenInDocsButton = ({ shareId, link, close }: Props) => {
    const { openInDocsAction } = useOpenInDocs(link);

    return (
        <ContextMenuButton
            name={getOpenInDocsString(link.mimeType)}
            icon={<MimeIcon name="proton-doc" className="mr-2" />}
            testId="context-menu-open-in-docs"
            action={() => {
                void openInDocsAction({ shareId, linkId: link.linkId });
            }}
            close={close}
        />
    );
};

export default OpenInDocsButton;
