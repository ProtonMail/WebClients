import type { Mock } from 'vitest';
import { vi } from 'vitest';

import useSpotlightOnFeature from '../../hooks/useSpotlightOnFeature';

vi.mock('../../hooks/useSpotlightOnFeature', () => ({
    __esModule: true,
    default: vi.fn(),
}));

type HookReturnType = ReturnType<typeof useSpotlightOnFeature>;
export const mockUseSpotlightOnFeature = (values: Partial<HookReturnType>) => {
    const mockedUseSpotlightOnFeature = useSpotlightOnFeature as unknown as Mock;

    mockedUseSpotlightOnFeature.mockReturnValue({
        onDisplayed: () => {},
        onClose: () => {},
        show: false,
        ...values,
    });

    return mockedUseSpotlightOnFeature;
};
