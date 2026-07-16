import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';

import { noSelection } from '../../../legacy/components/sections/ToolbarButtons/utils';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

type Item = {
    uid: string;
    isFile: boolean;
    name: string;
    mimeType: string;
    volumeId: string;
    linkId: string;
    parentLinkId: string;
    rootShareId: string;
};

type Props = ActionButtonProps & {
    selectedItems: Item[];
};

export const MoveButton = ({ selectedItems, type, onClick, close }: Props) => {
    if (noSelection(selectedItems)) {
        return null;
    }
    const title = c('Action').t`Move to folder`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowsCross alt={title} />}
                onClick={onClick}
                data-testid="toolbar-move"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcArrowsCross />}
                testId="context-menu-move"
                action={onClick}
                close={close}
            />
        );
    }
};
