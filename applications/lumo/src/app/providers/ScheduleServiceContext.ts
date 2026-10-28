import { createContext } from 'react';

import type { ScheduleService } from '../services/schedules/ScheduleService';

export const ScheduleServiceContext = createContext<ScheduleService | null>(null);
