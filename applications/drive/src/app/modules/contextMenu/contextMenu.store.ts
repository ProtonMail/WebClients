import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ContextMenuStore } from './types';

const DROPDOWN_ANIMATION_TIME = 200;

export const useContextMenuStore = create<ContextMenuStore>()(
    devtools(
        (set, get) => ({
            isOpen: false,
            position: undefined,
            lastCloseTime: undefined,

            open: () => {
                const state = get();
                const delay = !state.lastCloseTime ? 0 : DROPDOWN_ANIMATION_TIME - (Date.now() - state.lastCloseTime);

                setTimeout(
                    () => {
                        set({ isOpen: true });
                    },
                    Math.max(delay, 0)
                );
            },

            close: () => {
                set({
                    isOpen: false,
                    position: undefined,
                    lastCloseTime: Date.now(),
                });
            },

            handleContextMenu: (e) => {
                e.stopPropagation();
                e.preventDefault();

                set({ position: { top: e.clientY, left: e.clientX } });
                get().open();
            },

            handleContextMenuTouch: (e) => {
                e.stopPropagation();
                e.preventDefault();

                const touchPosition = e.changedTouches[e.changedTouches.length - 1];
                set({ position: { top: touchPosition.clientY, left: touchPosition.clientX } });
                get().open();
            },
        }),
        {
            name: 'drive-context-menu',
        }
    )
);
