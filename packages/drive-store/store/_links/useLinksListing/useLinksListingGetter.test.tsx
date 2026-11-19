import { act, renderHook } from '@testing-library/react';

import { wait } from '@proton/shared/lib/helpers/promise';

import { SharesKeysProvider } from '../../_shares/useSharesKeys';
import type { EncryptedLink } from '../interface';
import { useLinksListingProvider } from './useLinksListing';

vi.mock('../../_utils/errorHandler', () => {
    return {
        useErrorHandler: () => ({
            showErrorNotification: vi.fn(),
            showAggregatedErrorNotification: vi.fn(),
        }),
    };
});

const mockRequest = vi.hoisted(() => vi.fn());
vi.mock('../../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return { default: useDebouncedRequest };
});

vi.mock('../../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {};
    };
    return { default: useDriveCrypto };
});

vi.mock('../../_shares/useShare', () => {
    const useShare = () => {
        return {};
    };
    return { default: useShare };
});

vi.mock('../../_shares/useDefaultShare', () => {
    const useDefaultShare = () => {
        return {
            getDefaultShare: vi.fn(),
            getDefaultPhotosShare: vi.fn(),
        };
    };
    return { default: useDefaultShare };
});

const mockDecrypt = vi.hoisted(() => vi.fn());
vi.mock('../useLink', () => {
    const useLink = () => {
        return {
            decryptLink: mockDecrypt,
        };
    };
    return { default: useLink };
});

const mockGetChildren = vi.hoisted(() => vi.fn());
vi.mock('../useLinksState', () => {
    const useLinksState = () => {
        return {
            setLinks: vi.fn(),
            getChildren: mockGetChildren,
        };
    };
    return { default: useLinksState };
});

describe('useLinksListing', () => {
    const abortSignal = new AbortController().signal;
    let hook: {
        current: ReturnType<typeof useLinksListingProvider>;
    };

    beforeEach(() => {
        vi.resetAllMocks();

        mockDecrypt.mockImplementation((abortSignal: AbortSignal, shareId: string, encrypted: EncryptedLink) =>
            Promise.resolve(encrypted)
        );
        mockGetChildren.mockReturnValue([
            { encrypted: { linkId: 'onlyEncrypted' } },
            { encrypted: { linkId: 'decrypted' }, decrypted: { isStale: false } },
            { encrypted: { linkId: 'stale' }, decrypted: { isStale: true } },
        ]);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <SharesKeysProvider>{children}</SharesKeysProvider>
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
