import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { MemberRole } from '@proton/drive';

import { NODE_EDIT_EXPIRACY } from './constants';

interface UploadedFileData {
    timestamp: number;
}

export interface UserAddress {
    email: string;
    displayName: string;
}

interface PublicAuthStore {
    addresses: UserAddress[];
    isLoggedIn: boolean;
    publicRole: MemberRole;
    uploadedFiles: Map<string, UploadedFileData>;

    setAddresses: (addresses: UserAddress[]) => void;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    setPublicRole: (publicRole: MemberRole) => void;

    getUserMainAddress: () => UserAddress | undefined;
    hasUploadedFile: (uid: string) => boolean;
    addUploadedFile: (uid: string) => void;
    removeUploadedFiles: (uids: string | string[]) => void;
}

const hasExpired = (timestamp: number) => {
    return Date.now() - timestamp > NODE_EDIT_EXPIRACY;
};

export const usePublicAuthStore = create<PublicAuthStore>()(
    devtools(
        (set, get) => ({
            addresses: [],
            publicRole: MemberRole.Viewer,
            isLoggedIn: false,
            uploadedFiles: new Map<string, UploadedFileData>(),

            getUserMainAddress: () => {
                return get().addresses.at(0);
            },

            setAddresses: (addresses: UserAddress[]) => {
                set({ addresses });
            },

            setIsLoggedIn: (isLoggedIn: boolean) => {
                set({ isLoggedIn });
            },

            setPublicRole: (publicRole: MemberRole) => {
                set({ publicRole });
            },

            hasUploadedFile: (uid: string): boolean => {
                const state = get();
                const data = state.uploadedFiles.get(uid);
                if (data && hasExpired(data.timestamp)) {
                    const newMap = new Map(state.uploadedFiles);
                    newMap.delete(uid);
                    set({ uploadedFiles: newMap });
                    return false;
                }
                return !!data;
            },

            addUploadedFile: (uid: string) => {
                set((state) => ({
                    uploadedFiles: new Map(state.uploadedFiles).set(uid, {
                        timestamp: Date.now(),
                    }),
                }));
            },

            removeUploadedFiles: (uids: string | string[]) => {
                set((state) => {
                    const newMap = new Map(state.uploadedFiles);
                    const ids = Array.isArray(uids) ? uids : [uids];
                    ids.forEach((id) => newMap.delete(id));
                    return {
                        uploadedFiles: newMap,
                    };
                });
            },
        }),
        { name: 'PublicAuthStore' }
    )
);
