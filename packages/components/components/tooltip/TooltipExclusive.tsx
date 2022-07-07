import { createContext, ReactNode, useState } from 'react';

import arrayRemove from '@proton/utils/remove';
import lastItem from '@proton/utils/lastItem';

interface TooltipExclusiveContextValue {
    last?: string;
    add: (id: string) => void;
    remove: (id: string) => void;
}

export const TooltipExclusiveContext = createContext<TooltipExclusiveContextValue>({} as TooltipExclusiveContextValue);

const TooltipExclusive = ({ children }: { children: ReactNode }) => {
    const [tooltips, setTooltips] = useState<string[]>([]);

    const remove = (id: string) => {
        setTooltips((prev) => arrayRemove(prev, id));
    };

    const add = (id: string) => {
        setTooltips((prev) => [...prev, id]);
    };

    return (
        <TooltipExclusiveContext.Provider value={{ last: lastItem(tooltips), add, remove }}>
            {children}
        </TooltipExclusiveContext.Provider>
    );
};

export default TooltipExclusive;
