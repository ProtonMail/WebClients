import { useContext, createContext } from 'react';

export const MainAreaContext = createContext<React.RefObject<HTMLElement> | null>(null);
export const useMainArea = () => {
    const mainArea = useContext(MainAreaContext);

    if (mainArea === null) {
        throw new Error('Trying to use uninitialized MainAreaContext');
    }

    return mainArea;
};
