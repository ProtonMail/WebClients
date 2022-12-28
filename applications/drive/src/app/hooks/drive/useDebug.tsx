import { useLocalState } from '@proton/components/hooks';

/**
 * Reads a flag from local storage, if found returns true
 */
export const useDebug = () => {
    const [debug] = useLocalState(false, 'proton-drive-debug');
    return Boolean(debug);
};
