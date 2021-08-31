import { useContext, createContext, RefObject } from 'react';

export const MainAreaContext = createContext<RefObject<HTMLElement> | null>(null);

export const useMainArea = () => {
    const mainArea = useContext(MainAreaContext);

    if (mainArea === null) {
        throw new Error('Trying to use uninitialized MainAreaContext');
    }

    return mainArea;
};

export default useMainArea;
