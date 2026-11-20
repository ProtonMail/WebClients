import { act, renderHook } from '@testing-library/react';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SharesKeysProvider } from '../../_shares/useSharesKeys';
import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import type { EncryptedLink } from '../interface';
import { LinksStateProvider } from '../useLinksState';
import { useLinksListingProvider } from './useLinksListing';
import { PAGE_SIZE } from './useLinksListingHelpers';

const LINKS = [...Array(PAGE_SIZE * 2 - 1)].map((_, x) => ({ linkId: `children${x}`, parentLinkId: 'parentLinkId' }));

function linksToApiLinks(links: { linkId: string; parentLinkId: string }[]) {
    return links.map(({ linkId, parentLinkId }) => ({ LinkID: linkId, ParentLinkID: parentLinkId }));
}

vi.mock('../../_utils/errorHandler', () => {
    return {
        useErrorHandler: () => ({
            showErrorNotification: vi.fn(),
            showAggregatedErrorNotification: vi.fn(),
        }),
    };
});

const mockRequest = vi.fn();
vi.mock('../../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return { __esModule: true, default: useDebouncedRequest };
});

vi.mock('../../_crypto/useDriveCrypto', () => {
    const useDriveCrypto = () => {
        return {};
    };
    return { __esModule: true, default: useDriveCrypto };
});

vi.mock('../../_shares/useShare', () => {
    const useShare = () => {
        return {};
    };
    return { __esModule: true, default: useShare };
});

vi.mock('../../_shares/useDefaultShare', () => {
    const useDefaultShare = () => {
        return {
            getDefaultShare: vi.fn(),
            getDefaultPhotosShare: vi.fn(),
        };
    };
    return { useDefaultShare };
});

const mockDecrypt = vi.fn();
vi.mock('../useLink', () => {
    const useLink = () => {
        return {
            decryptLink: mockDecrypt,
        };
    };
    return { __esModule: true, default: useLink };
});

describe('useLinksListing', () => {
    const abortSignal = new AbortController().signal;
    let hook: {
        current: ReturnType<typeof useLinksListingProvider>;
    };

    beforeEach(() => {
        vi.resetAllMocks();

        mockDecrypt.mockImplementation((_abortSignal: AbortSignal, _shareId: string, encrypted: EncryptedLink) =>
            Promise.resolve(encrypted)
        );

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <VolumesStateProvider>
                <LinksStateProvider>
                    <SharesKeysProvider>{children}</SharesKeysProvider>
                </LinksStateProvider>
            </VolumesStateProvider>
        );

        const { result } = renderHook(() => useLinksListingProvider(), { wrapper });
        hook = result;
    });

    it('fetches children all pages with the same sorting', async () => {
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(0, PAGE_SIZE)) });
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(PAGE_SIZE)) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'createTime',
                sortOrder: SORT_DIRECTION.ASC,
            });
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'createTime',
                sortOrder: SORT_DIRECTION.ASC,
            });
        });
        // Check fetch calls - two pages.
        expect(mockRequest.mock.calls.map(([{ params }]) => params)).toMatchObject([
            { Page: 0, Sort: 'CreateTime', Desc: 0 },
            { Page: 1, Sort: 'CreateTime', Desc: 0 },
        ]);
        expect(hook.current.getCachedChildren(abortSignal, 'shareId', 'parentLinkId')).toMatchObject({
            links: LINKS,
            isDecrypting: false,
        });
        // Check decrypt calls - all links were decrypted.
        expect(mockDecrypt.mock.calls.map(([, , { linkId }]) => linkId)).toMatchObject(
            LINKS.map(({ linkId }) => linkId)
        );
    });

    it('fetches from the beginning when sorting changes', async () => {
        const links = LINKS.slice(0, PAGE_SIZE);
        mockRequest.mockReturnValue({ Links: linksToApiLinks(links) });
        // Separate acts, so the second fetch sees the state the first one rendered
        await act(() =>
            hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'createTime',
                sortOrder: SORT_DIRECTION.ASC,
            })
        );
        await act(() =>
            hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'createTime',
                sortOrder: SORT_DIRECTION.DESC,
            })
        );
        // Check fetch calls - twice starting from the first page.
        expect(mockRequest.mock.calls.map(([{ params }]) => params)).toMatchObject([
            { Page: 0, Sort: 'CreateTime', Desc: 0 },
            { Page: 0, Sort: 'CreateTime', Desc: 1 },
        ]);
        expect(hook.current.getCachedChildren(abortSignal, 'shareId', 'parentLinkId')).toMatchObject({
            links,
            isDecrypting: false,
        });
        // Check decrypt calls - the second call returned the same links, no need to decrypt them twice.
        expect(mockDecrypt.mock.calls.map(([, , { linkId }]) => linkId)).toMatchObject(
            links.map(({ linkId }) => linkId)
        );
    });

    it('skips fetch if all was fetched', async () => {
        const links = LINKS.slice(0, 5);
        mockRequest.mockReturnValue({ Links: linksToApiLinks(links) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId');
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId');
        });
        // Check fetch calls - first call fetched all, no need to call the second.
        expect(mockRequest).toHaveBeenCalledTimes(1);
        expect(hook.current.getCachedChildren(abortSignal, 'shareId', 'parentLinkId')).toMatchObject({
            links,
            isDecrypting: false,
        });
    });

    it('loads the whole folder', async () => {
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(0, PAGE_SIZE)) });
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(PAGE_SIZE)) });
        await act(async () => {
            await hook.current.loadChildren(abortSignal, 'shareId', 'parentLinkId');
        });
        expect(mockRequest.mock.calls.map(([{ params }]) => params)).toMatchObject([
            { Page: 0, Sort: 'CreateTime', Desc: 0 },
            { Page: 1, Sort: 'CreateTime', Desc: 0 },
        ]);
    });

    it('continues the load of the whole folder where it ended', async () => {
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(0, PAGE_SIZE)) });
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(PAGE_SIZE)) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'metaDataModifyTime', // Make sure it is not default.
                sortOrder: SORT_DIRECTION.ASC,
            });
            await hook.current.loadChildren(abortSignal, 'shareId', 'parentLinkId');
        });
        expect(mockRequest.mock.calls.map(([{ params }]) => params)).toMatchObject([
            { Page: 0, Sort: 'ModifyTime', Desc: 0 }, // Done by fetchChildrenNextPage.
            { Page: 1, Sort: 'ModifyTime', Desc: 0 }, // Done by loadChildren, continues with the same sorting.
        ]);
    });

    it("can count link's children", async () => {
        const PAGE_LENGTH = 5;
        const links = LINKS.slice(0, PAGE_LENGTH);
        mockRequest.mockReturnValueOnce({ Links: linksToApiLinks(links) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId');
        });
        expect(mockRequest).toHaveBeenCalledTimes(1);
        expect(hook.current.getCachedChildrenCount('shareId', 'parentLinkId')).toBe(PAGE_LENGTH);
    });
});
