import { createContext, useContext } from 'react';

import type { useItemMonitorChecks } from './useItemMonitorChecks';

export type ItemMonitorChecksValue = ReturnType<typeof useItemMonitorChecks>;

const ItemMonitorChecksContext = createContext<ItemMonitorChecksValue | null>(null);

export const ItemMonitorChecksProvider = ItemMonitorChecksContext.Provider;

export const useOptionalItemMonitorChecks = (): ItemMonitorChecksValue | null => useContext(ItemMonitorChecksContext);
