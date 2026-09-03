import type { FC, ReactElement } from 'react';

import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator';
import { IcPassLock } from '@proton/icons/icons/IcPassLock';

import type { Maybe, MaybeNull, MaybePromise } from '../../types';
import { useCopyToClipboard } from '../Settings/Clipboard/ClipboardProvider';
import { useContextMenu } from './ContextMenuProvider';

export type ContextMenuItemCopy = Maybe<() => MaybePromise<MaybeNull<string>>>;

export type ContextMenuItem = {
    type: 'button';
    icon: ReactElement;
    name: string;
    copy?: ContextMenuItemCopy;
    action?: () => void;
    lock?: boolean;
};

export type ContextMenuSeparator = { type: 'separator' };
export type ContextMenuElement = ContextMenuItem | ContextMenuSeparator;

type Props = { elements: ContextMenuElement[] };

export const ContextMenuContent: FC<Props> = ({ elements }) => {
    const { close } = useContextMenu();
    const copyToClipboard = useCopyToClipboard();

    const handleAction = async (element: ContextMenuItem) => {
        element.action?.();

        if (element.copy) {
            const value = await element.copy();
            if (value !== null) void copyToClipboard(value);
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
                        {element.lock === true && <IcPassLock size={3.5} className="ml-1.5" />}
                    </>
                }
                action={() => handleAction(element)}
                disabled={element.lock === true}
            />
        )
    );
};

export const CONTEXT_MENU_SEPARATOR: ContextMenuElement = { type: 'separator' };
