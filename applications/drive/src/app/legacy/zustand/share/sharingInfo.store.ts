import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type ShareResult, splitPublicLinkUid } from '@proton/drive/index';

type SharingInfoUI = {
    shareId: string;
    publicLinkId: string;
    publicLinkUrl: string;
    isExpired: boolean;
    creationTime: number;
    expirationTime: number | null;
    numberOfInitializedDownloads?: number;
};

type SharingInfoStore = {
    loadingUids: Set<string>;
    emptyOrFailedUids: Set<string>;
    sharingInfos: Map<string, SharingInfoUI>;

    setLoading: (uid: string) => void;
    setSharingInfo: (uid: string, sharingInfo: SharingInfoUI | undefined) => void;
    setSharingInfoEmptyOrFailed: (uid: string) => void;

    isLoading: (uid: string) => boolean;
    isEmptyOrFailed: (uid: string) => boolean;
    hasSharingInfo: (uid: string) => boolean;
    getSharingInfo: (uid: string) => SharingInfoUI | undefined;
};

export const mapShareResultToSharingInfo = (shareResult: ShareResult | undefined) => {
    let sharingInfo: SharingInfoUI | undefined = undefined;
    if (shareResult?.publicLink) {
        const { shareId, publicLinkId } = splitPublicLinkUid(shareResult.publicLink.uid);
        sharingInfo = {
            shareId,
            publicLinkId,
            publicLinkUrl: shareResult.publicLink.url,
            isExpired:
                !!shareResult.publicLink.expirationTime && new Date(shareResult.publicLink.expirationTime) < new Date(),
            creationTime: new Date(shareResult.publicLink.creationTime).getTime() / 1000,
            expirationTime: shareResult.publicLink.expirationTime
                ? new Date(shareResult.publicLink.expirationTime).getTime() / 1000
                : null,
            numberOfInitializedDownloads: shareResult.publicLink.numberOfInitializedDownloads,
        };
    }
    return sharingInfo;
};

export const useSharingInfoStore = create<SharingInfoStore>()(
    devtools((set, get) => ({
        sharingInfos: new Map(),
        loadingUids: new Set(),
        emptyOrFailedUids: new Set(),

        setLoading: (uid: string) => {
            set((state) => ({
                loadingUids: new Set(state.loadingUids).add(uid),
                emptyOrFailedUids: new Set([...state.emptyOrFailedUids].filter((id) => id !== uid)),
            }));
        },

        setSharingInfo: (uid: string, sharingInfo: SharingInfoUI | undefined) => {
            set((state) => {
                if (!sharingInfo) {
                    return {
                        loadingUids: new Set([...state.loadingUids].filter((id) => id !== uid)),
                        emptyOrFailedUids: new Set(state.emptyOrFailedUids).add(uid),
                    };
                }
                const newSharingInfos = new Map(state.sharingInfos);
                newSharingInfos.set(uid, sharingInfo);
                return {
                    sharingInfos: newSharingInfos,
                    loadingUids: new Set([...state.loadingUids].filter((id) => id !== uid)),
                    emptyOrFailedUids: new Set([...state.emptyOrFailedUids].filter((id) => id !== uid)),
                };
            });
        },

        setSharingInfoEmptyOrFailed: (uid: string) => {
            set((state) => ({
                emptyOrFailedUids: new Set(state.emptyOrFailedUids).add(uid),
                loadingUids: new Set([...state.loadingUids].filter((id) => id !== uid)),
            }));
        },

        isLoading: (uid: string) => get().loadingUids.has(uid),
        isEmptyOrFailed: (uid: string) => get().emptyOrFailedUids.has(uid),
        hasSharingInfo: (uid: string) => get().sharingInfos.has(uid),
        getSharingInfo: (uid: string) => get().sharingInfos.get(uid),
    }))
);
