import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { hasFoldersSelected, isMultiSelect } from '../../../components/sections/ToolbarButtons/utils';
import useOpenPreview from '../../../components/useOpenPreview';
import { type FolderButtonProps } from './types';

type Item = {
    uid: string;
    isFile: boolean;
    mimeType: string;
    rootShareId: string;
    linkId: string;
    size?: number;
};

type Props = Omit<FolderButtonProps, 'onClick'> & {
    selectedItems: Item[];
};

export const PreviewButton = ({ selectedItems, type, close }: Props) => {
    const openPreview = useOpenPreview();
    const item = selectedItems[0];

    const disabled =
        isMultiSelect(selectedItems) ||
        hasFoldersSelected(selectedItems) ||
        !item?.mimeType ||
        !isPreviewAvailable(item.mimeType, item.size);
    if (disabled) {
        return null;
    }

    const title = c('Action').t`Preview`;
    const icon = 'eye';

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={() => {
                    if (selectedItems.length) {
                        openPreview(item.rootShareId, item.linkId);
                    }
                }}
                data-testid="toolbar-preview"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-preview"
                action={() => openPreview(item.rootShareId, item.linkId)}
                close={() => close?.()}
            />
        );
    }
};
