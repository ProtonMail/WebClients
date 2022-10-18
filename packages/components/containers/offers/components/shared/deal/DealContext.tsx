import { createContext, useContext } from 'react';

import { DealProps } from '../../../interface';

const DealContext = createContext<DealProps | undefined>(undefined);

interface ProviderProps extends DealProps {
    children: React.ReactNode;
}

export const DealProvider = ({ children, ...props }: ProviderProps) => (
    <DealContext.Provider value={{ ...props }}>{children}</DealContext.Provider>
);

export const useDealContext = () => {
    const context = useContext(DealContext);

    if (context === undefined) {
        throw new Error('Deal context is not set');
    }

    return context;
};
