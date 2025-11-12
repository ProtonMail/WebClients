import type { FC } from 'react';

import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';
import { useContextMenuClose } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { useCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export type ContextMenuItem = {
    type: 'button';
    icon: IconName;
    name: string;
    copy?: ObfuscatedItemProperty | string;
    action?: () => void;
    lock?: boolean;
};

export type ContextMenuSeparator = { type: 'separator' };
export type ContextMenuElement = ContextMenuItem | ContextMenuSeparator;

type Props = { elements: ContextMenuElement[] };

export const ContextMenuContent: FC<Props> = ({ elements }) => {
    const close = useContextMenuClose();
    const copyToClipboard = useCopyToClipboard();

    const handleAction = (element: ContextMenuItem) => {
        element.action?.();

        if (element.copy) {
            const value = typeof element.copy === 'string' ? element.copy : deobfuscate(element.copy);
            void copyToClipboard(value);
        }

        close();
    };

    return elements.map((element, index) =>
        element.type === 'separator' ? (
            <ContextSeparator key={index} />
        ) : (
            <ContextMenuButton
                key={index}
                id={element.name}
                icon={element.icon}
                name={
                    <>
                        {element.name}
                        {element.lock === true && <Icon name="pass-lock" size={3.5} className="ml-1.5" />}
                    </>
                }
                action={() => handleAction(element)}
                disabled={element.lock === true}
            />
        )
    );
};

export const CONTEXT_MENU_SEPARATOR: ContextMenuElement = { type: 'separator' };
