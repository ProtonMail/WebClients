import { MimeIcon, ToolbarButton } from '@proton/components';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { hasFoldersSelected, isMultiSelect } from '../../../components/sections/ToolbarButtons/utils';
import { useOpenInDocs } from '../../../store/_documents';
import type { FolderButtonProps } from './types';

type Item = {
    uid: string;
    name: string;
    isFile: boolean;
    mimeType: string;
    parentLinkId: string;
    rootShareId: string;
    linkId: string;
};

type Props = Omit<FolderButtonProps, 'onClick'> & {
    selectedItems: Item[];
};

export const OpenInDocsButton = ({ selectedItems, type, close }: Props) => {
    const selectedItem = selectedItems.length > 0 ? selectedItems[0] : undefined;
    const openInDocsInfo = useOpenInDocs(selectedItem);

    if (!openInDocsInfo.canOpen || isMultiSelect(selectedItems) || hasFoldersSelected(selectedItems)) {
        return null;
    }

    const title = getOpenInDocsString(openInDocsInfo, openInDocsInfo.mimeType);
    const icon = <MimeIcon name={getOpenInDocsMimeIconName(openInDocsInfo)} className="mr-2" />;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={icon}
                onClick={() => openInDocsInfo.openDocument()}
                data-testid="toolbar-open-document"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-open-document"
                action={() => openInDocsInfo.openDocument()}
                close={() => close?.()}
            />
        );
    }
};
