import { renderHook, waitFor } from '@testing-library/react';

import { useGetUser } from '@proton/account/user/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';

import { getIsPublicContext } from '../../../utils/getIsPublicContext';
import { MetricUserPlan } from '../../../utils/type/MetricTypes';
import { getMetricsUserPlan } from './getMetricsUserPlan';
import { useGetMetricsUserPlan } from './useGetMetricsUserPlan';

vi.mock('@proton/account/user/hooks');
vi.mock('@proton/components/hooks/useAuthentication');
vi.mock('../../../utils/getIsPublicContext');
vi.mock('./getMetricsUserPlan');

const mockUser = {
    ID: 'test-user-id',
};
const mockPaidUser = {
    ...mockUser,
    Subscribed: 1,
};
const mockedUID = 'uid';

const mockGetUser = vi.fn();
const mockedUseGetUser = vi.mocked(useGetUser);
const mockedGetIsPublicContext = vi.mocked(getIsPublicContext);
const mockedUseAuthentication = vi.mocked(useAuthentication);
const mockedGetMetricsUserPlan = vi.mocked(getMetricsUserPlan);

describe('useGetMetricsUserPlan', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetUser.mockResolvedValue(mockUser);
        mockedUseGetUser.mockReturnValue(mockGetUser);
        mockedUseAuthentication.mockReturnValue({ UID: mockedUID } as any);
    });

    describe('private context', () => {
        beforeAll(() => {
            mockedGetIsPublicContext.mockReturnValue(false);
        });

        it('should call getMetricsUserPlan with correct parameters', async () => {
            mockedGetMetricsUserPlan.mockReturnValue(MetricUserPlan.Free);

            const { result } = renderHook(() => useGetMetricsUserPlan());

            await waitFor(() => {
                expect(mockedGetMetricsUserPlan).toHaveBeenCalledWith({
                    user: mockUser,
                    isPublicContext: false,
                });
                expect(result.current).toBe(MetricUserPlan.Free);
            });
        });

        it('should update when UID changes', async () => {
            mockedUseAuthentication.mockReturnValue({ UID: null } as any);
            mockedGetMetricsUserPlan.mockReturnValue(MetricUserPlan.Unknown);

            const { result, rerender } = renderHook(() => useGetMetricsUserPlan());
            expect(result.current).toBe(MetricUserPlan.Unknown);

            mockedUseAuthentication.mockReturnValue({ UID: mockedUID } as any);
            mockGetUser.mockResolvedValue(mockPaidUser);
            mockedGetMetricsUserPlan.mockReturnValue(MetricUserPlan.Paid);

            rerender();

            await waitFor(() => {
                expect(mockedGetMetricsUserPlan).toHaveBeenCalledWith({
                    user: mockPaidUser,
                    isPublicContext: false,
                });
                expect(result.current).toBe(MetricUserPlan.Paid);
            });
        });

        it('should handle error in getUser', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const error = new Error('Failed to get user');
            mockGetUser.mockRejectedValue(error);
            mockedGetMetricsUserPlan.mockReturnValue(MetricUserPlan.Unknown);

            const { result } = renderHook(() => useGetMetricsUserPlan());

            await waitFor(() => expect(result.current).toBe(MetricUserPlan.Unknown));

            consoleSpy.mockRestore();
            warnSpy.mockRestore();
        });
    });

    describe('public context', () => {
        beforeAll(() => {
            mockedGetIsPublicContext.mockReturnValue(true);
        });

        it('should handle anonymous case', async () => {
            mockedUseAuthentication.mockReturnValue({ UID: null } as any);
            mockedGetMetricsUserPlan.mockReturnValue(MetricUserPlan.Anonymous);

            const { result } = renderHook(() => useGetMetricsUserPlan());

            expect(mockGetUser).not.toHaveBeenCalled();
            await waitFor(() => {
                expect(mockedGetMetricsUserPlan).toHaveBeenCalledWith({
                    user: undefined,
                    isPublicContext: true,
                });
                expect(result.current).toBe(MetricUserPlan.Anonymous);
            });
        });

        it('should handle authenticated user case', async () => {
            mockedGetMetricsUserPlan.mockReturnValue(MetricUserPlan.Free);

            const { result } = renderHook(() => useGetMetricsUserPlan());

            await waitFor(() => {
                expect(mockedGetMetricsUserPlan).toHaveBeenCalledWith({
                    user: mockUser,
                    isPublicContext: true,
                });
                expect(result.current).toBe(MetricUserPlan.Free);
            });
        });
    });
});
