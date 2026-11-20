import { vi } from 'vitest';

// Single registration shared by mockUseFolders and mockUseLabels: a second vi.mock of the module would replace the first one
vi.mock('../../store/labels/hooks', async () => ({
    __esModule: true,
    ...(await vi.importActual('../../store/labels/hooks')),
    useFolders: vi.fn(),
    useLabels: vi.fn(),
}));

export {};
