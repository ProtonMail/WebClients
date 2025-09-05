import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

import type { ProduceForkData } from '../content/actions/forkInterface';

export const saveForkState = (state: ProduceForkData) => {
    setItem('fork-state', JSON.stringify(state));
};

export const clearForkState = () => {
    removeItem('fork-state');
};

export const readForkState = () => {
    try {
        const forkState: ProduceForkData = JSON.parse(getItem('fork-state') || '');
        if ('type' in forkState) {
            return forkState;
        }
    } catch {}
    return null;
};
