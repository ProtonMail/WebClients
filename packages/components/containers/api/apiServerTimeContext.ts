import { createContext } from 'react';

export type ApiServerTimeWithTimestamp = { serverTime: Date; serverTimeUpdatedAt: Date };

export default createContext<ApiServerTimeWithTimestamp | undefined>(undefined);
