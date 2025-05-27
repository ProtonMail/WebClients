import { create } from 'zustand';

interface AlbumProgressState {
    total: number;
    added: number;
    status: 'idle' | 'in-progress' | 'done' | 'error';
    setTotal: (count: number) => void;
    incrementAdded: (count?: number) => void;
    setStatus: (status: AlbumProgressState['status']) => void;
    reset: () => void;
}

export const useAlbumProgressStore = create<AlbumProgressState>((set) => ({
    total: 0,
    added: 0,
    status: 'idle',
    setTotal: (count) => set({ total: count }),
    incrementAdded: (count = 1) =>
        set((state) => {
            if (state.total <= 0) {
                throw Error('Cannot increment progress when total is 0');
            }
            return { added: state.added + count };
        }),
    setStatus: (status) =>
        set((state) => {
            if (state.status === 'done' && status === 'in-progress') {
                return {
                    status,
                    total: 0,
                    added: 0,
                };
            }
            return { status };
        }),
    reset: () =>
        set({
            total: 0,
            added: 0,
            status: 'idle',
        }),
}));
