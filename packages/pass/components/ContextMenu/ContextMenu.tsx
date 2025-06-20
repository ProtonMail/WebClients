import type { FC } from 'react';

import type { ContextMenuProps } from '@proton/components/components/contextMenu/ContextMenu';
import DsContextMenu from '@proton/components/components/contextMenu/ContextMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';

type Props = Omit<ContextMenuProps, 'size' | 'isOpen' | 'close' | 'position'> & { id: string };

export const ContextMenu: FC<Props> = ({ id, ...rest }) => {
    const { isOpen, close, position } = useContextMenu();

    return (
        <DsContextMenu
            {...rest}
            size={{ maxHeight: DropdownSizeUnit.Viewport }}
            isOpen={isOpen(id)}
            close={close}
            position={position}
        />
    );
};
