import { createSharedContext } from '@proton/pass/utils/context';

import type { WorkerContextInterface } from './types';

export const WorkerContext = createSharedContext<WorkerContextInterface>('worker');
