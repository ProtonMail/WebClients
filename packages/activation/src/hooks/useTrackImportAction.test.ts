import { renderHook } from '@testing-library/react';

import { ApiImportProvider } from '../api/api.interface';
import { ImportType } from '../interface';
import { useTrackImportAction } from './useTrackImportAction';

const mockGetIsBYOE = jest.fn();

jest.mock('./useGetIsBYOE', () => ({
    useGetIsBYOE: () => mockGetIsBYOE,
}));

jest.mock('@proton/telemetry-tracker/lib/tracker', () => ({
    tracker: { emit: jest.fn() },
}));

describe('useTrackImportAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
