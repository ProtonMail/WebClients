import { useEffect } from 'react';

import { c } from 'ttag';

import type { MaybeNull } from '@proton/pass/types';
import type { ContextMenuItem } from '@proton/pass/types/desktop/context-menu';
import { logger } from '@proton/pass/utils/logger';

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
                await openContextMenu([
                    { label: c('Action').t`Cut`, role: 'cut' },
                    { label: c('Action').t`Copy`, role: 'copy' },
                    { label: c('Action').t`Paste`, role: 'paste' },
                ]);
            } catch (error) {
                logger.error('[ContextMenu] Error opening context menu', error);
            }
        };

        document.addEventListener('contextmenu', contextMenuListener);
        return () => document.removeEventListener('contextmenu', contextMenuListener);
    }, []);
};
