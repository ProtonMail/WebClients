import { act, renderHook } from '@testing-library/react-hooks';

import { useSharesStore } from '../../zustand/share/shares.store';
import { VolumesStateProvider } from '../_volumes/useVolumesState';
import useDefaultShare from './useDefaultShare';

const mockRequest = jest.fn();
const mockCreateVolume = jest.fn();
const mockGetShare = jest.fn();
const mockGetShareWithKey = jest.fn();

jest.mock('../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return useDebouncedRequest;
});

jest.mock('../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {
            getOwnAddressAndPrimaryKeys: () => {},
        };
    };

    return useDriveCrypto;
});

jest.mock('../_utils/useDebouncedFunction', () => {
    const useDebouncedFunction = () => {
        return (wrapper: any) => wrapper();
    };
    return useDebouncedFunction;
});

jest.mock('../_shares/useShare', () => {
    const useLink = () => {
        return {
            getShare: mockGetShare,
            getShareWithKey: mockGetShareWithKey,
        };
    };
    return useLink;
});

jest.mock('./useVolume', () => {
    const useVolume = () => {
        return {
            createVolume: mockCreateVolume,
        };
    };
    return useVolume;
});

describe('useDefaultShare', () => {
    let hook: {
        current: ReturnType<typeof useDefaultShare>;
    };

    const defaultShareId = Symbol('shareId');

    const ac = new AbortController();

    beforeEach(() => {
        jest.resetAllMocks();

        // Reset the Zustand store state
        useSharesStore.setState({
            defaultSharePromise: null,
            loadUserSharesPromise: null,
            defaultPhotosSharePromise: null,
            isLoadingShares: false,
        });

        mockCreateVolume.mockImplementation(async () => {
            return { shareId: defaultShareId };
        });

        mockRequest.mockImplementation(async () => {
            return { Shares: [] };
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>{children}</VolumesStateProvider>
        );

        const { result } = renderHook(() => useDefaultShare(), { wrapper });
        hook = result;
    });

    it('creates a volume if existing shares are locked/soft deleted', async () => {
        await act(async () => {
            await hook.current.getDefaultShare();
        });

        expect(mockCreateVolume.mock.calls.length).toBe(1);
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), defaultShareId);
    });

    it('creates a volume if no shares exist', async () => {
        mockRequest.mockImplementation(async () => {
            return { Shares: [] };
        });

        await act(async () => {
            await hook.current.getDefaultShare();
        });

        expect(mockCreateVolume.mock.calls.length).toBe(1);
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), defaultShareId);
    });

    it("creates a volume if default share doesn't exist", async () => {
        mockRequest.mockImplementation(async () => {
            return {
                Shares: [
                    {
                        isDefault: false,
                    },
                ],
            };
        });

        await act(async () => {
            await hook.current.getDefaultShare();
        });

        expect(mockCreateVolume.mock.calls.length).toBe(1);
        expect(mockGetShareWithKey).toHaveBeenCalledWith(expect.anything(), defaultShareId);
    });

    it('says share is available by default', async () => {
        mockGetShare.mockImplementation(async () => ({}));

        await act(async () => {
            const isAvailable = await hook.current.isShareAvailable(ac.signal, 'shareId');
            expect(isAvailable).toBeTruthy();
        });
    });

    it('says share is not available if locked', async () => {
        mockGetShare.mockImplementation(async () => {
            return {
                isLocked: true,
            };
        });

        await act(async () => {
            const isAvailable = await hook.current.isShareAvailable(ac.signal, 'shareId');
            expect(isAvailable).toBeFalsy();
        });
    });
});
