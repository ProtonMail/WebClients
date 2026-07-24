import type { UploadController } from '@protontech/drive-sdk';
import { create } from 'zustand';

type UploadControllerStore = {
    controllers: Map<string, { uploadController: UploadController | null; abortController: AbortController }>;

    setController: (
        uploadId: string,
        controller: { uploadController: UploadController | null; abortController: AbortController }
    ) => void;
    /**
     * Registers abort controllers for one or many uploads in a single state update.
     */
    setAbortControllers: (abortControllers: Map<string, AbortController>) => void;
    setUploadController: (uploadId: string, uploadController: UploadController) => void;
    /**
     * Removes one or many controllers in a single state update.
     */
    removeControllers: (uploadIds: string[]) => void;
    getController: (
        uploadId: string
    ) => { uploadController: UploadController | null; abortController: AbortController } | undefined;
    clearAllControllers: () => void;
};

export const useUploadControllerStore = create<UploadControllerStore>()((set, get) => ({
    controllers: new Map(),

    setController: (uploadId, controller) =>
        set((state) => ({
            controllers: new Map(state.controllers).set(uploadId, controller),
        })),

    setAbortControllers: (abortControllers) =>
        set((state) => {
            let controllers = state.controllers;
            for (const [uploadId, abortController] of abortControllers) {
                const existing = controllers.get(uploadId);
                if (existing?.abortController === abortController) {
                    continue;
                }
                if (controllers === state.controllers) {
                    controllers = new Map(state.controllers);
                }
                controllers.set(uploadId, {
                    uploadController: existing?.uploadController || null,
                    abortController,
                });
            }
            return controllers === state.controllers ? state : { controllers };
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

    removeControllers: (uploadIds) =>
        set((state) => {
            if (uploadIds.length === 0) {
                return state;
            }
            const controllers = new Map(state.controllers);
            for (const uploadId of uploadIds) {
                controllers.delete(uploadId);
            }
            return { controllers };
        }),

    getController: (uploadId) => get().controllers.get(uploadId),

    clearAllControllers: () => set({ controllers: new Map() }),
}));
