import { act, renderHook } from '@testing-library/react-hooks';

import { wait } from '@proton/shared/lib/helpers/promise';

import { SharesKeysProvider } from '../../_shares/useSharesKeys';
import { SharesStateProvider } from '../../_shares/useSharesState';
import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import type { EncryptedLink } from '../interface';
import { useLinksListingProvider } from './useLinksListing';

jest.mock('../../_utils/errorHandler', () => {
    return {
        useErrorHandler: () => ({
            showErrorNotification: jest.fn(),
            showAggregatedErrorNotification: jest.fn(),
        }),
    };
});

const mockRequest = jest.fn();
jest.mock('../../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return useDebouncedRequest;
});

jest.mock('../../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {};
    };
    return useDriveCrypto;
});

jest.mock('../../_events/useDriveEventManager', () => {
    const useDriveEventManager = () => {
        return {
            eventHandlers: {
                register: () => 'id',
                unregister: () => false,
            },
        };
    };
    return {
        useDriveEventManager,
    };
});

jest.mock('../../_shares/useShare', () => {
    const useShare = () => {
        return {};
    };
    return useShare;
});

jest.mock('../../_shares/useDefaultShare', () => {
    const useDefaultShare = () => {
        return {};
    };
    return useDefaultShare;
});

const mockDecrypt = jest.fn();
jest.mock('../useLink', () => {
    const useLink = () => {
        return {
            decryptLink: mockDecrypt,
        };
    };
    return useLink;
});

const mockGetChildren = jest.fn();
jest.mock('../useLinksState', () => {
    const useLinksState = () => {
        return {
            setLinks: jest.fn(),
            getChildren: mockGetChildren,
        };
    };
    return useLinksState;
});

describe('useLinksListing', () => {
    const abortSignal = new AbortController().signal;
    let hook: {
        current: ReturnType<typeof useLinksListingProvider>;
    };

    beforeEach(() => {
        jest.resetAllMocks();

        mockDecrypt.mockImplementation((abortSignal: AbortSignal, shareId: string, encrypted: EncryptedLink) =>
            Promise.resolve(encrypted)
        );
        mockGetChildren.mockReturnValue([
            { encrypted: { linkId: 'onlyEncrypted' } },
            { encrypted: { linkId: 'decrypted' }, decrypted: { isStale: false } },
            { encrypted: { linkId: 'stale' }, decrypted: { isStale: true } },
        ]);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>
                <SharesStateProvider>
                    <SharesKeysProvider>{children}</SharesKeysProvider>
                </SharesStateProvider>
            </VolumesStateProvider>
        );

        const { result } = renderHook(() => useLinksListingProvider(), { wrapper });
        hook = result;
    });

    it('decrypts all non-decrypted links if listing is not fetching', async () => {
        act(() => {
            hook.current.getCachedChildren(abortSignal, 'shareId', 'parentLinkId');
        });
        expect(mockDecrypt.mock.calls.map(([, , { linkId }]) => linkId)).toMatchObject(['onlyEncrypted', 'stale']);
    });

    it('re-decrypts only stale links if listing is fetching (and decrypting)', async () => {
        // Make some delay to make sure fetching is in progress when
        // getCachedChildren is called.
        mockRequest.mockImplementation(async () => {
            await wait(200);
            return { Links: [] };
        });
        await act(async () => {
            const fetchPromise = hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId');
            await wait(100); // Wait till previous call sets inProgress.
            hook.current.getCachedChildren(abortSignal, 'shareId', 'parentLinkId');
            await fetchPromise;
        });
        expect(mockDecrypt.mock.calls.map(([, , { linkId }]) => linkId)).toMatchObject(['stale']);
    });
});
