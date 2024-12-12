import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AnonymousUploadTokenState } from './types';

const TOKEN_EXPIRACY = 59 * 60 * 1000; // 59 minutes (1h token - 1 min to be safe)
export const useAnonymousUploadAuthStore = create<AnonymousUploadTokenState>()(
    devtools(
        (set) => ({
            uploadTokens: new Map(),
            setUploadToken: ({ linkId, authorizationToken }) => {
                set((state) => ({
                    ...state,
                    uploadTokens: new Map(state.uploadTokens).set(linkId, authorizationToken),
                }));

                // Remove after 1 hour (Token expiracy)
                setTimeout(() => {
                    set((state) => {
                        const newMap = new Map(state.uploadTokens);
                        newMap.delete(linkId);
                        return {
                            ...state,
                            uploadTokens: newMap,
                        };
                    });
                }, TOKEN_EXPIRACY);
            },
            removeUploadTokens: (linkIds: string | string[]) => {
                set((state) => {
                    const newMap = new Map(state.uploadTokens);
                    const ids = Array.isArray(linkIds) ? linkIds : [linkIds];
                    ids.forEach((id) => newMap.delete(id));
                    return {
                        ...state,
                        uploadTokens: newMap,
                    };
                });
            },
        }),
        { name: 'AnonymousStore' }
    )
);
