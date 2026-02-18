import { MimeIcon, ToolbarButton } from '@proton/components';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { useOpenInDocs } from '../../../store/_documents';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    selectedBrowserItems: {
        rootShareId: string;
        linkId: string;
        mimeType: string;
        parentLinkId: string;
        isFile: boolean;
    }[];
}

const OpenInDocsButton = ({ selectedBrowserItems }: Props) => {
    const selectedBrowserItem = selectedBrowserItems.length > 0 ? selectedBrowserItems[0] : undefined;
    const openInDocs = useOpenInDocs(selectedBrowserItem);

    if (!openInDocs.canOpen || isMultiSelect(selectedBrowserItems) || hasFoldersSelected(selectedBrowserItems)) {
        return null;
    }

    return (
        <ToolbarButton
            title={getOpenInDocsString(openInDocs, openInDocs.mimeType)}
            icon={<MimeIcon name={getOpenInDocsMimeIconName(openInDocs)} className="mr-2" />}
            onClick={() => openInDocs.openDocument()}
            data-testid="toolbar-open-document"
        />
    );
};

export default OpenInDocsButton;
