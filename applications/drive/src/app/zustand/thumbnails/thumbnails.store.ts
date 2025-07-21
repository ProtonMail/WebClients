import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ThumbnailType = {
    sdUrl?: string;
    hdUrl?: string;
    uid?: string;
};

type ThumbnailsStore = {
    thumbnails: Record<string, ThumbnailType>;
    setThumbnail: (uid: string, obj: ThumbnailType) => void;
};

export const useThumbnailStore = create<ThumbnailsStore>()(
    devtools((set) => ({
        thumbnails: {},
        setThumbnail: (revId: string, obj: ThumbnailType) =>
            set((state) => {
                const newThumbnails = { ...state.thumbnails };
                newThumbnails[revId] = obj;
                return {
                    ...state,
                    thumbnails: newThumbnails,
                };
            }),
    }))
);
