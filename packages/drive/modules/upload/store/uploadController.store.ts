import type { UploadController } from '@protontech/drive-sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type UploadControllerStore = {
    controllers: Map<string, { uploadController: UploadController | null; abortController: AbortController }>;

    setController: (
        uploadId: string,
        controller: { uploadController: UploadController | null; abortController: AbortController }
    ) => void;
    setAbortController: (uploadId: string, abortController: AbortController) => void;
    setUploadController: (uploadId: string, uploadController: UploadController) => void;
    removeController: (uploadId: string) => void;
    getController: (
        uploadId: string
    ) => { uploadController: UploadController | null; abortController: AbortController } | undefined;
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

            setAbortController: (uploadId, abortController) =>
                set((state) => {
                    const controllers = new Map(state.controllers);
                    const existing = controllers.get(uploadId);
                    controllers.set(uploadId, {
                        uploadController: existing?.uploadController || null,
                        abortController,
                    });
                    return { controllers };
                }),

            setUploadController: (uploadId, uploadController) =>
                set((state) => {
                    const controllers = new Map(state.controllers);
                    const existing = controllers.get(uploadId);
                    if (existing) {
                        controllers.set(uploadId, {
                            uploadController,
                            abortController: existing.abortController,
                        });
                    }
                    return { controllers };
                }),

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
