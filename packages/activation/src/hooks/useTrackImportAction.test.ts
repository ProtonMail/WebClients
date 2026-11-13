import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { ApiImportProvider } from '../api/api.interface';
import { ImportType } from '../interface';
import { useTrackImportAction } from './useTrackImportAction';

const mockGetIsBYOE = vi.fn();

vi.mock('./useGetIsBYOE', () => ({
    useGetIsBYOE: () => mockGetIsBYOE,
}));

vi.mock('@proton/telemetry-tracker/lib/tracker', () => ({
    tracker: { emit: vi.fn() },
}));

describe('useTrackImportAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should emit the import report action with the import dimensions', async () => {
        mockGetIsBYOE.mockResolvedValue(true);

        const { result } = renderHook(() =>
            useTrackImportAction({
                account: 'user@gmail.com',
                provider: ApiImportProvider.GOOGLE,
                product: ImportType.MAIL,
            })
        );

        await result.current('cancel_import');

        expect(mockGetIsBYOE).toHaveBeenCalledWith('user@gmail.com');
    });
});
