import { MimeIcon, ToolbarButton } from '@proton/components';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';

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
    const { openInDocsAction, showOpenInDocs } = useOpenInDocs(selectedBrowserItem);

    if (!showOpenInDocs || isMultiSelect(selectedBrowserItems) || hasFoldersSelected(selectedBrowserItems)) {
        return null;
    }

    return (
        <ToolbarButton
            title={getOpenInDocsString(selectedBrowserItem?.mimeType)}
            icon={<MimeIcon name="proton-doc" className="mr-2" />}
            onClick={() => {
                if (selectedBrowserItem) {
                    void openInDocsAction({
                        shareId: selectedBrowserItem.rootShareId,
                        linkId: selectedBrowserItem.linkId,
                    });
                }
            }}
            data-testid="toolbar-open-in-docs"
        />
    );
};

export default OpenInDocsButton;
