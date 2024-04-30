import { act, renderHook } from '@testing-library/react-hooks';

import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { Share, ShareType } from '../../_shares/interface';
import { VerificationError } from '../worker/verifier';
import useUploadMetrics, {
    UploadErrorCategory,
    UploadShareType,
    getErrorCategory,
    getShareType,
} from './useUploadMetrics';

jest.mock('@proton/metrics');

const mockGetShare = jest.fn();
jest.mock('../../_shares/useSharesState', () => {
    const useSharesState = () => {
        return {
            getShare: mockGetShare,
        };
    };
    return useSharesState;
});

describe('useUploadMetrics::', () => {
    describe('getShareType', () => {
        it('for default share', () => {
            expect(
                getShareType({
                    type: ShareType.default,
                } as Share)
            ).toBe(UploadShareType.Own);
        });

        it('for photos share', () => {
            expect(
                getShareType({
                    type: ShareType.photos,
                } as Share)
            ).toBe(UploadShareType.Photo);
        });

        it('for device share', () => {
            expect(
                getShareType({
                    type: ShareType.device,
                } as Share)
            ).toBe(UploadShareType.Device);
        });

        it('for standard share', () => {
            expect(
                getShareType({
                    type: ShareType.standard,
                } as Share)
            ).toBe(UploadShareType.Shared);
        });

        it('for no share', () => {
            expect(getShareType(undefined)).toBe(UploadShareType.Shared);
        });

        it('for any other type of share', () => {
            expect(
                getShareType({
                    type: -1, // not specified type
                } as any)
            ).toBe(UploadShareType.Shared);
        });
    });

    describe('getErrorCategory', () => {
        it('for offline error', () => {
            const error = new Error('No network connection');
            error.name = 'OfflineError';
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.NetworkError);
        });

        it('for network error', () => {
            const error = new Error('Network error');
            error.name = 'NetworkError';
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.NetworkError);
        });

        it('for timeout error', () => {
            const error = new Error('Request timed out');
            error.name = 'TimeoutError';
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.NetworkError);
        });

        it('for verification error', () => {
            const error = new VerificationError();
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.IntegrityError);
        });

        it('for free space exceeded error', () => {
            const error = new Error('Unprocessable Content');
            (error as any).data = { Code: API_CUSTOM_ERROR_CODES.FREE_SPACE_EXCEEDED, Error: 'Free space exceeded' };
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.FreeSpaceExceeded);
        });

        it('for too many children error', () => {
            const error = new Error('Unprocessable Content');
            (error as any).data = { Code: API_CUSTOM_ERROR_CODES.TOO_MANY_CHILDREN, Error: 'Too many children' };
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.TooManyChildren);
        });

        it('for any error', () => {
            const error = new Error('Random error');
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.Unknown);
        });
    });

    describe('uploadFailed', () => {
        const mockMetricsSuccessRate = jest.fn();
        const mockMetricsErrors = jest.fn();
        const mockMetricsErroringUsers = jest.fn();

        let hook: {
            current: {
                uploadFailed: (shareId: string, error: any, numberOfErrors: number) => void;
            };
        };

        beforeEach(() => {
            jest.resetAllMocks();
            const isPaid = true;
            const { result } = renderHook(() =>
                useUploadMetrics(isPaid, {
                    drive_upload_success_rate_total: { increment: mockMetricsSuccessRate },
                    drive_upload_errors_total: { increment: mockMetricsErrors },
                    drive_upload_erroring_users_total: { increment: mockMetricsErroringUsers },
                } as any)
            );
            hook = result;
        });

        it('does capture erroring user only every 10 minutes', () => {
            act(() => {
                jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:00:00'));
                hook.current.uploadFailed('defaultShareId', new Error('error'), 1);
                hook.current.uploadFailed('defaultShareId', new Error('error'), 2);
                hook.current.uploadFailed('defaultShareId', new Error('error'), 3);
                jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:10:10')); // 10 minutes + few sec later
                hook.current.uploadFailed('defaultShareId', new Error('error'), 4);
            });
            expect(mockMetricsSuccessRate).toHaveBeenCalledTimes(4);
            expect(mockMetricsSuccessRate).toHaveBeenCalledWith({
                initiator: 'explicit',
                retry: 'false',
                shareType: 'shared',
                status: 'failure',
            });
            expect(mockMetricsSuccessRate).toHaveBeenCalledWith({
                initiator: 'explicit',
                retry: 'true',
                shareType: 'shared',
                status: 'failure',
            });
            expect(mockMetricsErrors).toHaveBeenCalledTimes(4);
            expect(mockMetricsErrors).toHaveBeenCalledWith({
                initiator: 'explicit',
                shareType: 'shared',
                type: 'unknown',
            });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(2);
            expect(mockMetricsErroringUsers).toHaveBeenCalledWith({
                initiator: 'explicit',
                plan: 'paid',
                shareType: 'shared',
            });
        });
    });
});
