import { createContext, useContext } from 'react';

import type { ScheduleService } from '../services/schedules/ScheduleService';

export const ScheduleServiceContext = createContext<ScheduleService | null>(null);

export const useScheduleService = () => useContext(ScheduleServiceContext);
