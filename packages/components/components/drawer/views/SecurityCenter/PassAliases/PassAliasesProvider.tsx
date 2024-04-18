import { createContext, useContext } from 'react';

import { usePassAliasesSetup } from './usePassAliasesProviderSetup';

const PassAliasesContext = createContext<ReturnType<typeof usePassAliasesSetup> | undefined>(undefined);

export const PassAliasesProvider = ({ children }: { children: React.ReactNode }) => {
    const passAliasesSetup = usePassAliasesSetup();

    return <PassAliasesContext.Provider value={passAliasesSetup}>{children}</PassAliasesContext.Provider>;
};

/**
 * Expose method calling the PassBridge API
 */
export const usePassAliasesContext = () => {
    const context = useContext(PassAliasesContext);

    if (context === undefined) {
        throw new Error('usePassAliases must be used within a PassAliasesProvider');
    }

    return context;
};
