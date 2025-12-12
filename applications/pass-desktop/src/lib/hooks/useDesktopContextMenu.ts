import { useEffect } from 'react';

import { c } from 'ttag';

import type { MaybeNull } from '@proton/pass/types';
import type { ContextMenuItem } from '@proton/pass/types/desktop/context-menu';
import { logger } from '@proton/pass/utils/logger';
import isTruthy from '@proton/utils/isTruthy';

const COPY_PASTE_NODE_WHITELIST = ['INPUT', 'TEXTAREA'];

const matchNodeWhiteList = (target: MaybeNull<EventTarget>) => {
    if (!target || !(target instanceof Node)) return false;
    return COPY_PASTE_NODE_WHITELIST.includes(target.nodeName);
};

const openContextMenu = async (items: ContextMenuItem[]) => {
    // Make sure not to serialize `onSelected`
    const electronMenuItems = items.map(({ label, type, role }) => ({ label, type, role }));
    const selection = await window.ctxBridge?.openContextMenu(electronMenuItems);
    if (selection === undefined || selection === -1) return;

    await items[selection].onSelected?.();
};

export const useDesktopContextMenu = () => {
    useEffect(() => {
        const contextMenuListener = async (event: MouseEvent) => {
            if (!matchNodeWhiteList(event.target)) return;

            try {
                const isReadonly = (event.target as HTMLTextAreaElement | HTMLInputElement).readOnly;
                const items: ContextMenuItem[] = [
                    !isReadonly && { label: c('Action').t`Cut`, role: 'cut' as const },
                    { label: c('Action').t`Copy`, role: 'copy' as const },
                    !isReadonly && { label: c('Action').t`Paste`, role: 'paste' as const },
                ].filter(isTruthy);

                await openContextMenu(items);
            } catch (error) {
                logger.error('[ContextMenu] Error opening context menu', error);
            }
        };

        document.addEventListener('contextmenu', contextMenuListener);
        return () => document.removeEventListener('contextmenu', contextMenuListener);
    }, []);
};
