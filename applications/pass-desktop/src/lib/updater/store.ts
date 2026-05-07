import { UpdateStatus } from '@proton/pass/types/desktop';
import type { UpdateStore } from '@proton/pass/types/desktop';

import { store } from '../../store';
import { calculateUpdateDistribution } from './helpers';

export const getUpdateStore = (): UpdateStore => {
    const stored = store.get('update');
    return {
        distribution: stored?.distribution ?? calculateUpdateDistribution(),
        beta: stored?.beta ?? false,
        status: stored?.status ?? UpdateStatus.Idle,
        newVersion: stored?.newVersion ?? null,
        progress: stored?.progress ?? null,
    };
};

export const setUpdateStore = (update: Partial<UpdateStore>) => {
    const stored = getUpdateStore();
    store.set('update', { ...stored, ...update });
};

export const onUpdateStore = (callback: (value: UpdateStore | undefined) => void) =>
    store.onDidChange('update', callback);

export const initUpdateStore = () => {
    if (store.get('update')?.distribution == null) {
        setUpdateStore({ distribution: calculateUpdateDistribution() });
    }
};
