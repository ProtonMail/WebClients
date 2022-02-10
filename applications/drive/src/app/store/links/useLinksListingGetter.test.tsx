import { renderHook, act } from '@testing-library/react-hooks';

import { wait } from '@proton/shared/lib/helpers/promise';

import { EncryptedLink } from './interface';
import { useLinksListingProvider } from './useLinksListing';

jest.mock('../utils/errorHandler', () => {
    return {
        useErrorHandler: () => ({
            showErrorNotification: jest.fn(),
            showAggregatedErrorNotification: jest.fn(),
        }),
    };
});

const mockRequst = jest.fn();
jest.mock('../api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequst;
    };
    return useDebouncedRequest;
});

jest.mock('../events/useDriveEventManager', () => {
    const useDriveEventManager = () => {
        return {
            registerEventHandler: () => undefined,
            unregisterEventHandler: () => undefined,
        };
    };
    return {
        useDriveEventManager,
    };
});

jest.mock('../shares/useShare', () => {
    const useLink = () => {
        return {};
    };
    return useLink;
});

const mockDecrypt = jest.fn();
jest.mock('./useLink', () => {
    const useLink = () => {
        return {
            decryptLink: mockDecrypt,
        };
    };
    return useLink;
});

const mockGetChildren = jest.fn();
jest.mock('./useLinksState', () => {
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

        const { result } = renderHook(() => useLinksListingProvider());
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
        mockRequst.mockImplementation(async () => {
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
