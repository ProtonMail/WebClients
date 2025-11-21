import type { UploadController } from '@protontech/drive-sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type UploadControllerStore = {
    controllers: Map<string, { uploadController: UploadController; abortController: AbortController }>;

    setController: (
        uploadId: string,
        controller: { uploadController: UploadController; abortController: AbortController }
    ) => void;
    removeController: (uploadId: string) => void;
    getController: (
        uploadId: string
    ) => { uploadController: UploadController; abortController: AbortController } | undefined;
    clearAllControllers: () => void;
};

export const useUploadControllerStore = create<UploadControllerStore>()(
    devtools(
        (set, get) => ({
            controllers: new Map(),

            setController: (uploadId, controller) =>
                set((state) => ({
                    controllers: new Map(state.controllers).set(uploadId, controller),
                })),

            removeController: (uploadId) =>
                set((state) => {
                    const controllers = new Map(state.controllers);
                    controllers.delete(uploadId);
                    return { controllers };
                }),

            getController: (uploadId) => get().controllers.get(uploadId),

            clearAllControllers: () => set({ controllers: new Map() }),
        }),
        { name: 'UploadControllersStore' }
    )
);
