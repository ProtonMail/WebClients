import type { FC, ReactNode } from 'react';

import type { ContextMenuProps } from '@proton/components/components/contextMenu/ContextMenu';
import DsContextMenu from '@proton/components/components/contextMenu/ContextMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { ContextMenuContent, type ContextMenuElement } from '@proton/pass/components/ContextMenu/ContextMenuItems';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';

type Props = Omit<ContextMenuProps, 'size' | 'isOpen' | 'close' | 'position' | 'children'> & {
    id: string;
    children?: ReactNode;
    elements?: ContextMenuElement[];
};

export const ContextMenu: FC<Props> = ({ id, children, elements, ...rest }) => {
    const { isOpen, close, state } = useContextMenu();

    return (
        <DsContextMenu
            {...rest}
            size={{ maxHeight: DropdownSizeUnit.Viewport }}
            isOpen={isOpen(id)}
            close={close}
            position={state?.position}
        >
            {children}
            {elements && elements?.length > 0 && <ContextMenuContent elements={elements} />}
        </DsContextMenu>
    );
};
