import { create } from 'zustand';

interface FreeUploadStore {
    isFreeUploadInProgress: boolean;
    bigCounterVisible: boolean; // Whether DriveEmptyViewFreeUpload component is rendered
    secondsLeft: number;
    targetTime: number; // milliseconds since beginning of the UNIX epoch

    beginCountdown: (targetTime: number) => void;
    abortCountdown: () => void;
    refreshSecondsLeft: () => void;
    setBigCounterVisible: (emptyViewVisible: boolean) => void;
}

export const useFreeUploadStore = create<FreeUploadStore>((set) => ({
    isFreeUploadInProgress: false,
    bigCounterVisible: false,
    secondsLeft: 10 * 60, // 10 minutes
    targetTime: 0,

    beginCountdown: (targetTime) => set(() => ({ isFreeUploadInProgress: true, targetTime })),
    abortCountdown: () => set(() => ({ isFreeUploadInProgress: false, secondsLeft: 0 })),
    refreshSecondsLeft: () =>
        set((state) => {
            const secondsLeft = Math.max(Math.round((state.targetTime - Date.now()) / 1000), 0);
            return { secondsLeft, isFreeUploadInProgress: secondsLeft > 0 };
        }),
    setBigCounterVisible: (bigCounterVisible: boolean) => set(() => ({ bigCounterVisible })),
}));
