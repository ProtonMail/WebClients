import { type FC, type ReactNode, useEffect } from 'react';

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
    const { close, state } = useContextMenu();

    useEffect(() => {
        let width = window.outerWidth;
        let height = window.outerHeight;

        /** Close on window resize, but ignore spurious resize events
         * that Firefox extension popups sometimes fire when dropdowns
         * or popovers are opened without actual dimension changes. */
        const closeOnResize = () => {
            const newWidth = window.outerWidth;
            const newHeight = window.outerHeight;
            if (newWidth !== width || newHeight !== height) close();
            width = newWidth;
            height = newHeight;
        };

        window.addEventListener('resize', closeOnResize, { capture: true });
        return () => window.removeEventListener('resize', closeOnResize, { capture: true });
    }, []);

    return (
        <DsContextMenu
            {...rest}
            size={{ maxHeight: DropdownSizeUnit.Viewport }}
            isOpen={state?.id === id}
            close={close}
            position={state?.position}
        >
            {children}
            {elements && elements?.length > 0 && <ContextMenuContent elements={elements} />}
        </DsContextMenu>
    );
};
