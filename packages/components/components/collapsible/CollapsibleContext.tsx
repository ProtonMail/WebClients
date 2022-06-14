import { createContext } from 'react';

export interface CollapsibleContextValue {
    isExpanded: boolean;
    toggle: () => void;
    headerId: string;
    contentId: string;
}

const CollapsibleContext = createContext({} as CollapsibleContextValue);

export default CollapsibleContext;
