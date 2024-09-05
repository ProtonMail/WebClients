import { createContext, useContext } from 'react';

export const ItemRouteContext = createContext<{ prefix?: string }>({});
export const useItemRoute = () => useContext(ItemRouteContext);
