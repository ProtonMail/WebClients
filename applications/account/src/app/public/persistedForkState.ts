import type { ProduceForkData } from '@proton/shared/lib/authentication/fork/interface';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

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
