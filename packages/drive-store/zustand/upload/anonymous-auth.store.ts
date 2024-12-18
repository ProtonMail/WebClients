import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AnonymousUploadTokenState, TokenData } from './types';

const TOKEN_EXPIRACY = 59 * 60 * 1000; // 59 minutes (1h token - 1 min to be safe)

const hasExpired = (timestamp: number) => Date.now() - timestamp > TOKEN_EXPIRACY;

export const useAnonymousUploadAuthStore = create<AnonymousUploadTokenState>()(
    devtools(
        (set, get) => ({
            _uploadTokens: new Map<string, TokenData>(),
            hasUploadToken: (linkId: string): boolean => {
                const state = get();
                const data = state._uploadTokens.get(linkId);
                if (data && hasExpired(data.timestamp)) {
                    useAnonymousUploadAuthStore.getState().removeUploadTokens([linkId]);
                    return false;
                }
                return !!data;
            },
            getUploadToken: (linkId: string): string | undefined => {
                const state = get();
                const data = state._uploadTokens.get(linkId);
                if (data && hasExpired(data.timestamp)) {
                    useAnonymousUploadAuthStore.getState().removeUploadTokens([linkId]);
                    return undefined;
                }
                return data?.token;
            },
            setUploadToken: ({ linkId, authorizationToken }) => {
                set((state) => ({
                    _uploadTokens: new Map(state._uploadTokens).set(linkId, {
                        token: authorizationToken,
                        timestamp: Date.now(),
                    }),
                }));
            },
            removeUploadTokens: (linkIds: string | string[]) => {
                set((state) => {
                    const newMap = new Map(state._uploadTokens);
                    const ids = Array.isArray(linkIds) ? linkIds : [linkIds];
                    ids.forEach((id) => newMap.delete(id));
                    return {
                        _uploadTokens: newMap,
                    };
                });
            },
        }),
        { name: 'AnonymousStore' }
    )
);
