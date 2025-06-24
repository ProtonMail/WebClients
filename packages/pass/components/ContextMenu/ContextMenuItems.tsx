import type { FC } from 'react';

import type { IconName } from 'packages/icons';

import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator';
import { useContextMenuClose } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { useCopyToClipboard } from '@proton/pass/hooks/useCopyToClipboard';
import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export type ContextMenuItem = {
    type: 'button';
    icon: IconName;
    name: string;
    copy?: ObfuscatedItemProperty | string;
    action?: () => void;
};

export type ContextMenuSeparator = {
    type: 'separator';
};

export type ContextMenuElement = ContextMenuItem | ContextMenuSeparator;

type Props = {
    elements: ContextMenuElement[];
};

export const ContextMenuContent: FC<Props> = ({ elements }) => {
    const close = useContextMenuClose();
    const copyToClipboard = useCopyToClipboard();

    const handleAction = async (element: ContextMenuItem) => {
        if (element.action) {
            element.action();
        }
        if (element.copy) {
            const value = typeof element.copy === 'string' ? element.copy : deobfuscate(element.copy);
            await copyToClipboard(value);
        }
        close();
    };

    return elements.map((element, index) =>
        element.type === 'separator' ? (
            <ContextSeparator key={index} />
        ) : (
            <ContextMenuButton
                key={index}
                icon={element.icon}
                name={element.name}
                action={() => handleAction(element)}
            />
        )
    );
};
