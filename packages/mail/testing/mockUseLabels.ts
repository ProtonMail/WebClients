import { vi } from 'vitest';

import type { Label } from '@proton/shared/lib/interfaces/Label';

import './mockLabelsHooks';
import * as useLabelsModule from '../store/labels/hooks';

export const mockUseLabels = (params?: [Label[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseLabels = vi.mocked(useLabelsModule.useLabels);
    mockedUseLabels.mockReturnValue([value, loading]);

    return mockedUseLabels;
};
