import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc';
import { MimeProtonSheet } from '@proton/file-icons/icons/MimeProtonSheet';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { hasFoldersSelected, isMultiSelect } from '../../../legacy/components/sections/ToolbarButtons/utils';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import type { ActionButtonProps } from '../../buttons/types';

type Item = {
    uid: string;
    name: string;
    isFile: boolean;
    mimeType: string;
    parentLinkId: string;
    rootShareId: string;
    linkId: string;
};

type Props = Omit<ActionButtonProps, 'onClick'> & {
    selectedItems: Item[];
};

export const OpenInDocsButton = ({ selectedItems, type, close }: Props) => {
    const selectedItem = selectedItems[0];
    const documentInfo = selectedItem ? getOpenInDocsInfo(selectedItem.mimeType) : undefined;
    if (!documentInfo || isMultiSelect(selectedItems) || hasFoldersSelected(selectedItems)) {
        return null;
    }

    const onClick = async () => {
        if (!selectedItem) {
            return;
        }
        const openInDocsInfo = getOpenInDocsInfo(selectedItem.mimeType);
        if (openInDocsInfo) {
            await openDocsOrSheetsDocument({
                uid: selectedItem.uid,
                isNative: openInDocsInfo.isNative,
                type: openInDocsInfo.type,
                openBehavior: 'tab',
            });
        }
    };

    const title = getOpenInDocsString(documentInfo, selectedItem.mimeType);
    const DocumentTypeIcon = documentInfo.type === 'spreadsheet' ? MimeProtonSheet : MimeProtonDoc;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<DocumentTypeIcon alt={title} />}
                onClick={onClick}
                data-testid="toolbar-open-document"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<DocumentTypeIcon />}
                testId="context-menu-open-document"
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
