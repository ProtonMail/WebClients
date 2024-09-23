import { act, renderHook } from '@testing-library/react-hooks';

import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { MetricShareType, UploadErrorCategory } from '../../../utils/type/MetricTypes';
import type { Share } from '../../_shares/interface';
import { ShareType } from '../../_shares/interface';
import { VerificationError } from '../worker/verifier';
import type { FileUploadReady } from './interface';
import type { FailedUploadMetadata } from './useUploadMetrics';
import useUploadMetrics, { getErrorCategory, getFailedUploadMetadata, getShareType } from './useUploadMetrics';

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

const mockFailedUploadMetadata = (numberOfErrors: number, size: number = 10000) => ({
    shareId: 'defaultShareId',
    numberOfErrors: numberOfErrors,
    encryptedTotalTransferSize: size + 45000, // random number
    roundedUnencryptedFileSize: size,
});

describe('useUploadMetrics::', () => {
    const freeSpaceExceeded = new Error('Unprocessable Content');
    (freeSpaceExceeded as any).data = {
        Code: API_CUSTOM_ERROR_CODES.FREE_SPACE_EXCEEDED,
        Error: 'Free space exceeded',
    };

    const tooManyChildren = new Error('Unprocessable Content');
    (tooManyChildren as any).data = { Code: API_CUSTOM_ERROR_CODES.TOO_MANY_CHILDREN, Error: 'Too many children' };

    describe('getShareType', () => {
        it('for default share', () => {
            expect(
                getShareType({
                    type: ShareType.default,
                } as Share)
            ).toBe(MetricShareType.Main);
        });

        it('for photos share', () => {
            expect(
                getShareType({
                    type: ShareType.photos,
                } as Share)
            ).toBe(MetricShareType.Photo);
        });

        it('for device share', () => {
            expect(
                getShareType({
                    type: ShareType.device,
                } as Share)
            ).toBe(MetricShareType.Device);
        });

        it('for standard share', () => {
            expect(
                getShareType({
                    type: ShareType.standard,
                } as Share)
            ).toBe(MetricShareType.Shared);
        });

        it('for no share', () => {
            expect(getShareType(undefined)).toBe(MetricShareType.Shared);
        });

        it('for any other type of share', () => {
            expect(
                getShareType({
                    type: -1, // not specified type
                } as any)
            ).toBe(MetricShareType.Shared);
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
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.ServerError);
        });

        it('for verification error', () => {
            const error = new VerificationError();
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.IntegrityError);
        });

        it('for free space exceeded error', () => {
            expect(getErrorCategory(freeSpaceExceeded)).toBe(UploadErrorCategory.FreeSpaceExceeded);
        });

        it('for too many children error', () => {
            expect(getErrorCategory(tooManyChildren)).toBe(UploadErrorCategory.TooManyChildren);
        });

        it('for any 429 rate limited response code', () => {
            const error = new Error('Rate Limited');
            (error as any).statusCode = 429;
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.RateLimited);
        });

        it('for any 4xx response code', () => {
            const error = new Error('Random error');
            (error as any).statusCode = 498;
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.HTTPClientError);
        });

        it('for any 5xx response code', () => {
            const error = new Error('Random error');
            (error as any).statusCode = 589;
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.HTTPServerError);
        });

        it('for any error', () => {
            const error = new Error('Random error');
            expect(getErrorCategory(error)).toBe(UploadErrorCategory.Unknown);
        });
    });

    describe('uploadSucceeded', () => {
        const mockMetricsSuccessRate = jest.fn();
        const mockMetricsErrors = jest.fn();
        const mockMetricsErroringUsers = jest.fn();
        const mockMetricsErrorFileSize = jest.fn();
        const mockMetricsErrorTransferSize = jest.fn();

        let hook: {
            current: {
                uploadSucceeded: (shareId: string, numberOfErrors?: number) => void;
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
                    drive_upload_errors_file_size_histogram: { observe: mockMetricsErrorFileSize },
                    drive_upload_errors_transfer_size_histogram: { observe: mockMetricsErrorTransferSize },
                } as any)
            );
            hook = result;
        });

        it('reports first attemp as not retry', () => {
            act(() => {
                hook.current.uploadSucceeded('shareId', 0);
                expect(mockMetricsSuccessRate).toHaveBeenCalledWith({
                    status: 'success',
                    shareType: 'shared',
                    retry: 'false',
                    initiator: 'explicit',
                });
            });
        });

        it('reports second attemp as retry', () => {
            act(() => {
                hook.current.uploadSucceeded('shareId', 1);
                expect(mockMetricsSuccessRate).toHaveBeenCalledWith({
                    status: 'success',
                    shareType: 'shared',
                    retry: 'true',
                    initiator: 'explicit',
                });
            });
        });
    });

    describe('uploadFailed', () => {
        const mockMetricsSuccessRate = jest.fn();
        const mockMetricsErrors = jest.fn();
        const mockMetricsErroringUsers = jest.fn();
        const mockMetricsErrorFileSize = jest.fn();
        const mockMetricsErrorTransferSize = jest.fn();

        let hook: {
            current: {
                uploadFailed: (failedUploadMetadata: FailedUploadMetadata, error: any) => void;
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
                    drive_upload_errors_file_size_histogram: { observe: mockMetricsErrorFileSize },
                    drive_upload_errors_transfer_size_histogram: { observe: mockMetricsErrorTransferSize },
                } as any)
            );
            hook = result;
        });

        it('reports first attemp as not retry', () => {
            act(() => {
                hook.current.uploadFailed(mockFailedUploadMetadata(1, 10000), new Error('error'));
                expect(mockMetricsSuccessRate).toHaveBeenCalledWith({
                    initiator: 'explicit',
                    retry: 'false',
                    shareType: 'shared',
                    status: 'failure',
                });
            });
        });

        it('reports second attemp as retry', () => {
            act(() => {
                hook.current.uploadFailed(mockFailedUploadMetadata(2, 10000), new Error('error'));
                expect(mockMetricsSuccessRate).toHaveBeenCalledWith({
                    initiator: 'explicit',
                    retry: 'true',
                    shareType: 'shared',
                    status: 'failure',
                });
            });
        });

        it('does capture erroring user only every 5 minutes', () => {
            act(() => {
                jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:00:00'));
                hook.current.uploadFailed(mockFailedUploadMetadata(1, 10000), new Error('error'));
                hook.current.uploadFailed(mockFailedUploadMetadata(2, 20000), new Error('error'));
                hook.current.uploadFailed(mockFailedUploadMetadata(3, 30000), new Error('error'));
                jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:5:10')); // 5minutes + few sec later
                hook.current.uploadFailed(mockFailedUploadMetadata(4, 40000), new Error('error'));
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
            expect(mockMetricsErrorFileSize).toHaveBeenCalledTimes(4);
            expect(mockMetricsErrorFileSize).toHaveBeenNthCalledWith(1, {
                Value: 10000,
                Labels: {},
            });
            expect(mockMetricsErrorFileSize).toHaveBeenNthCalledWith(2, {
                Value: 20000,
                Labels: {},
            });
            expect(mockMetricsErrorFileSize).toHaveBeenNthCalledWith(3, {
                Value: 30000,
                Labels: {},
            });
            expect(mockMetricsErrorFileSize).toHaveBeenNthCalledWith(4, {
                Value: 40000,
                Labels: {},
            });
            expect(mockMetricsErrorTransferSize).toHaveBeenCalledTimes(4);
        });

        it('ignores sucess rate metric for validation error', () => {
            act(() => {
                hook.current.uploadFailed(mockFailedUploadMetadata(1), freeSpaceExceeded);
                expect(mockMetricsSuccessRate).toHaveBeenCalledTimes(0);
                expect(mockMetricsErrors).toHaveBeenCalledTimes(1);
            });
        });

        it('doesnt ignore sucess rate metric for unknown error', () => {
            act(() => {
                hook.current.uploadFailed(mockFailedUploadMetadata(1), new Error('unknown error'));
                expect(mockMetricsSuccessRate).toHaveBeenCalledTimes(1);
                expect(mockMetricsErrors).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('getFailedUploadMetadata', () => {
        const mockFileUploadReady = {
            shareId: 'test-share-id',
            numberOfErrors: 2,
            file: {
                size: 25000,
            },
        } as FileUploadReady;

        it('should calculate metadata correctly', () => {
            const mockProgresses = {
                file1: 5000,
                file2: 7000,
                file3: 3000,
            };

            const result = getFailedUploadMetadata(mockFileUploadReady, mockProgresses);

            const expectedResult: FailedUploadMetadata = {
                shareId: 'test-share-id',
                numberOfErrors: 2,
                encryptedTotalTransferSize: 15000,
                roundedUnencryptedFileSize: 30000,
            };

            expect(result).toEqual(expectedResult);
        });

        it('should handle empty progresses object', () => {
            const result = getFailedUploadMetadata(mockFileUploadReady, {});

            expect(result.encryptedTotalTransferSize).toBe(0);
        });

        it('should round up file size to minimum ROUND_BYTES', () => {
            const smallFileUpload = {
                ...mockFileUploadReady,
                file: { size: 5000 },
            } as FileUploadReady;

            const result = getFailedUploadMetadata(smallFileUpload, {});

            expect(result.roundedUnencryptedFileSize).toBe(10000);
        });

        it('should round file size to nearest ROUND_BYTES multiple', () => {
            const largeFileUpload = {
                ...mockFileUploadReady,
                file: { size: 55000 },
            } as FileUploadReady;

            const result = getFailedUploadMetadata(largeFileUpload, {});

            expect(result.roundedUnencryptedFileSize).toBe(60000);
        });
    });
});
