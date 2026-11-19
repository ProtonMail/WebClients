import { act, renderHook } from '@testing-library/react';

import { VolumeState, VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { useSharesStore } from '../../zustand/share/shares.store';
import { ShareType } from './interface';
import useDefaultShare from './useDefaultShare';

const mockRequest = vi.hoisted(() => vi.fn());
const mockCreateVolume = vi.hoisted(() => vi.fn());
const mockListVolumes = vi.hoisted(() => vi.fn());
const mockGetShare = vi.hoisted(() => vi.fn());
const mockGetShareWithKey = vi.hoisted(() => vi.fn());

vi.mock('../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return { default: useDebouncedRequest };
});

vi.mock('../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {
            getOwnAddressAndPrimaryKeys: () => {},
        };
    };

    return { default: useDriveCrypto };
});

vi.mock('../_utils/useDebouncedFunction', () => {
    const useDebouncedFunction = () => {
        return (wrapper: any) => wrapper();
    };
    return { default: useDebouncedFunction };
});

vi.mock('../_shares/useShare', () => {
    const useLink = () => {
        return {
            getShare: mockGetShare,
            getShareWithKey: mockGetShareWithKey,
        };
    };
    return { default: useLink };
});

vi.mock('./useVolume', () => {
    const useVolume = () => {
        return {
            createVolume: mockCreateVolume,
            listVolumes: mockListVolumes,
        };
    };
    return { default: useVolume };
});

describe('useDefaultShare', () => {
    let hook: {
        current: ReturnType<typeof useDefaultShare>;
    };

    const defaultShareId = Symbol('shareId');

    beforeEach(() => {
        vi.resetAllMocks();

        // Reset the Zustand store state
        useSharesStore.setState({
            shares: {},
            defaultSharePromise: null,
            loadUserSharesPromise: null,
            defaultPhotosSharePromise: null,
            isLoadingShares: false,
        });

        mockCreateVolume.mockImplementation(async () => {
            return { shareId: defaultShareId };
        });

        mockListVolumes.mockImplementation(async () => {
            return { Volumes: [] };
        });

        mockRequest.mockImplementation(async () => {
            return { Shares: [] };
        });

        const { result } = renderHook(() => useDefaultShare());
        hook = result;
    });

    it('creates a volume if no main volume exists', async () => {
        mockListVolumes.mockImplementation(async () => {
            return { Volumes: [] };
        });

        await act(async () => {
            await hook.current.getDefaultShare();
        });

        expect(mockCreateVolume).toHaveBeenCalledTimes(1);
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), defaultShareId);
    });

    it('creates a volume if main volume is locked', async () => {
        mockListVolumes.mockImplementation(async () => {
            return {
                Volumes: [
                    {
                        Type: VolumeType.Regular,
                        State: VolumeState.Locked,
                    },
                ],
            };
        });

        await act(async () => {
            await hook.current.getDefaultShare();
        });

        expect(mockCreateVolume).toHaveBeenCalledTimes(1);
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), defaultShareId);
    });

    it('does not create a volume if main volume exists and is not locked', async () => {
        mockListVolumes.mockImplementation(async () => {
            return {
                Volumes: [
                    {
                        Type: VolumeType.Regular,
                        State: VolumeState.Active,
                    },
                ],
            };
        });

        mockRequest.mockImplementation(async () => {
            return {
                Shares: [
                    {
                        Type: ShareType.default,
                        ShareID: 'existing-share',
                    },
                ],
            };
        });

        await act(async () => {
            await hook.current.getDefaultShare();
        });

        expect(mockCreateVolume).not.toHaveBeenCalled();
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), 'existing-share');
    });

    it('prevents concurrent calls from calling createVolume twice', async () => {
        let createVolumeCallCount = 0;
        mockCreateVolume.mockImplementation(async () => {
            createVolumeCallCount++;
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { shareId: defaultShareId };
        });

        mockListVolumes.mockImplementation(async () => {
            return { Volumes: [] };
        });

        let promises: Promise<any>[];
        await act(async () => {
            promises = [hook.current.getDefaultShare(), hook.current.getDefaultShare()];
            await Promise.all(promises);
        });

        expect(createVolumeCallCount).toBe(1);
        expect(mockGetShareWithKey).toHaveBeenCalledTimes(2);
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), defaultShareId);
    });
});
