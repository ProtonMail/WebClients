import { MimeIcon, ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../../utils/docs/openInDocs';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    selectedBrowserItems: {
        rootShareId: string;
        volumeId: string;
        linkId: string;
        mimeType: string;
        parentLinkId: string;
        isFile: boolean;
    }[];
}

const OpenInDocsButton = ({ selectedBrowserItems }: Props) => {
    const selectedBrowserItem = selectedBrowserItems.length > 0 ? selectedBrowserItems[0] : undefined;
    const openInDocsInfo = selectedBrowserItem?.mimeType ? getOpenInDocsInfo(selectedBrowserItem.mimeType) : undefined;

    if (!openInDocsInfo || isMultiSelect(selectedBrowserItems) || hasFoldersSelected(selectedBrowserItems)) {
        return null;
    }

    const title = getOpenInDocsString(openInDocsInfo, selectedBrowserItem?.mimeType ?? '');

    return (
        <ToolbarButton
            title={title}
            icon={<MimeIcon name={getOpenInDocsMimeIconName(openInDocsInfo)} className="mr-2" alt={title} />}
            onClick={() => {
                if (!selectedBrowserItem) {
                    return;
                }
                void openDocsOrSheetsDocument({
                    uid: generateNodeUid(selectedBrowserItem.volumeId, selectedBrowserItem.linkId),
                    type: openInDocsInfo.type,
                    isNative: openInDocsInfo.isNative,
                    openBehavior: 'tab',
                });
            }}
            data-testid="toolbar-open-document"
        />
    );
};

export default OpenInDocsButton;
