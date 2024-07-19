import type { ReactNode } from 'react';

import type { PlanCardFeatureDefinition } from '../../../features/interface';

export interface Item extends Omit<PlanCardFeatureDefinition, 'status' | 'highlight' | 'included'> {
    status?: PlanCardFeatureDefinition['status'];
    included?: PlanCardFeatureDefinition['included'];
    actionElement?: ReactNode;
    dataTestId?: string;
}
