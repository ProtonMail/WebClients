import type { MemberRole } from '@protontech/drive-sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type TransferItem = {
    role: MemberRole;
    type: 'upload' | 'download';
};

// Mapped based on the transfer manager entry id, NOT the node uid
type TransferManagerStore = {
    queue: Map<string, TransferItem>;
    addItem: (entryId: string, item: TransferItem) => void;
    getItem: (entryId: string) => TransferItem | undefined;
};

export const useTransferManagerStore = create<TransferManagerStore>()(
    devtools(
        (set, get) => ({
            queue: new Map(),

            addItem: (entryId, item) => {
                set((state) => ({
                    queue: new Map(state.queue).set(entryId, item),
                }));
            },

            getItem: (entryId) => get().queue.get(entryId),
        }),
        { name: 'TransferManagerStore' }
    )
);
