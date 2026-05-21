import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { getCanWrite } from '@proton/shared/lib/drive/permissions';

import type { PublicShareStore } from './types';

export const usePublicShareStore = create<PublicShareStore>()(
    devtools(
        (set) => ({
            publicShare: undefined,
            viewOnly: false,
            setPublicShare: (publicShare) => {
                const canWrite = getCanWrite(publicShare.sharedUrlInfo.permissions);
                set({ publicShare, viewOnly: !canWrite });
            },
        }),
        { name: 'PublicShareStore' }
    )
);
