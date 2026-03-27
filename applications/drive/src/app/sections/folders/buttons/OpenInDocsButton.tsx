import { MimeIcon, ToolbarButton } from '@proton/components';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { hasFoldersSelected, isMultiSelect } from '../../../components/sections/ToolbarButtons/utils';
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
    const documentInfo = mimeTypeToOpenInDocsType(selectedItem?.mimeType);
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
    const icon = <MimeIcon name={getOpenInDocsMimeIconName(documentInfo)} className="mr-2" />;

    if (type === 'toolbar') {
        return <ToolbarButton title={title} icon={icon} onClick={onClick} data-testid="toolbar-open-document" />;
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-open-document"
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
