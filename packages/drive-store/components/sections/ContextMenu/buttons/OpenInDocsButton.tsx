import { MimeIcon } from '@proton/components/components';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { useOpenInDocs } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedBrowserItem: { rootShareId: string; linkId: string; mimeType: string; parentLinkId: string };
    close: () => void;
}

const OpenInDocsButton = ({ selectedBrowserItem, close }: Props) => {
    const { openInDocsAction } = useOpenInDocs(selectedBrowserItem);

    return (
        <ContextMenuButton
            name={getOpenInDocsString(selectedBrowserItem.mimeType)}
            icon={<MimeIcon name="proton-doc" className="mr-2" />}
            testId="context-menu-open-in-docs"
            action={() => {
                void openInDocsAction({ shareId: selectedBrowserItem.rootShareId, linkId: selectedBrowserItem.linkId });
            }}
            close={close}
        />
    );
};

export default OpenInDocsButton;
