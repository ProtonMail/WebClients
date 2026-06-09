import type { MemberRole } from '@protontech/drive-sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type TransferItem = {
    role: MemberRole;
    type: 'upload' | 'download';
};

export enum TransferManagerBannerType {
    StorageFull = 'StorageFull',
}

// Mapped based on the transfer manager entry id, NOT the node uid
type TransferManagerStore = {
    queue: Map<string, TransferItem>;
    bannerType: TransferManagerBannerType | undefined;
    addItem: (entryId: string, item: TransferItem) => void;
    getItem: (entryId: string) => TransferItem | undefined;
    setBannerType: (value: TransferManagerBannerType | undefined) => void;
};

export const useTransferManagerStore = create<TransferManagerStore>()(
    devtools(
        (set, get) => ({
            queue: new Map(),
            bannerType: undefined,

            addItem: (entryId, item) => {
                set((state) => ({
                    queue: new Map(state.queue).set(entryId, item),
                }));
            },

            getItem: (entryId) => get().queue.get(entryId),

            setBannerType: (value) => set({ bannerType: value }),
        }),
        { name: 'TransferManagerStore' }
    )
);
