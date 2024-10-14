import { useMemo } from 'react';

import { getTotalAdded } from './helpers';

export const useAddedQuantities = (model: { quantities?: Record<string, number> }) =>
    useMemo(() => getTotalAdded(model.quantities), [model]);

export const useUnassigningAddedQuantities = (model: { unassignedIpQuantities?: Record<string, number> }) =>
    useMemo(() => getTotalAdded(model.unassignedIpQuantities), [model]);
