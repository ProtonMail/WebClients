import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';

import { hasFoldersSelected, noSelection } from '../../../legacy/components/sections/ToolbarButtons/utils';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

type Item = {
    uid: string;
    name: string;
    isFile: boolean;
};

type Props = ActionButtonProps & {
    selectedItems: Item[];
    disabledFolders?: boolean;
};

export const DownloadButton = ({ selectedItems, onClick, type, close, disabledFolders }: Props) => {
    if (noSelection(selectedItems) || (disabledFolders && hasFoldersSelected(selectedItems))) {
        return null;
    }

    const title = c('Action').t`Download`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowDownLine alt={title} />}
                onClick={onClick}
                data-testid="toolbar-download"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcArrowDownLine />}
                testId="context-menu-download"
                action={onClick}
                close={close}
            />
        );
    }
};
