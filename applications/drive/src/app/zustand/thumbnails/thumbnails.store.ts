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
    getThumbnail: (uid: string) => ThumbnailType;
};

export const useThumbnailStore = create<ThumbnailsStore>()(
    devtools(
        (set, get) => ({
            thumbnails: {},
            getThumbnail: (revId: string) => get().thumbnails[revId],
            setThumbnail: (revId: string, obj: ThumbnailType) =>
                set((state) => {
                    const newThumbnails = { ...state.thumbnails };
                    newThumbnails[revId] = obj;
                    return {
                        ...state,
                        thumbnails: newThumbnails,
                    };
                }),
        }),
        {
            name: 'drive-thumbnail',
        }
    )
);
