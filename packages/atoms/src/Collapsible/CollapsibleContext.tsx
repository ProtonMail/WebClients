import { createContext } from 'react';

export interface CollapsibleContextValue {
    isExpanded: boolean;
    disabled?: boolean;
    toggle: () => void;
    headerId: string;
    contentId: string;
}

export const CollapsibleContext = createContext({} as CollapsibleContextValue);
