import { renderHook, act } from '@testing-library/react-hooks';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { EncryptedLink } from './interface';
import { PAGE_SIZE, useLinksListingProvider } from './useLinksListing';
import { LinksStateProvider } from './useLinksState';

const LINKS = [...Array(PAGE_SIZE * 2 - 1)].map((_, x) => ({ linkId: `children${x}`, parentLinkId: 'parentLinkId' }));

function linksToApiLinks(links: { linkId: string; parentLinkId: string }[]) {
    return links.map(({ linkId, parentLinkId }) => ({ LinkID: linkId, ParentLinkID: parentLinkId }));
}

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

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <LinksStateProvider>{children}</LinksStateProvider>
        );

        const { result } = renderHook(() => useLinksListingProvider(), { wrapper });
        hook = result;
    });

    it('fetches children all pages with the same sorting', async () => {
        mockRequst.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(0, PAGE_SIZE)) });
        mockRequst.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(PAGE_SIZE)) });
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
        expect(mockRequst.mock.calls.map(([{ params }]) => params)).toMatchObject([
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
        mockRequst.mockReturnValue({ Links: linksToApiLinks(links) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'createTime',
                sortOrder: SORT_DIRECTION.ASC,
            });
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'createTime',
                sortOrder: SORT_DIRECTION.DESC,
            });
        });
        // Check fetch calls - twice starting from the first page.
        expect(mockRequst.mock.calls.map(([{ params }]) => params)).toMatchObject([
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
        mockRequst.mockReturnValue({ Links: linksToApiLinks(links) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId');
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId');
        });
        // Check fetch calls - first call fetched all, no need to call the second.
        expect(mockRequst).toBeCalledTimes(1);
        expect(hook.current.getCachedChildren(abortSignal, 'shareId', 'parentLinkId')).toMatchObject({
            links,
            isDecrypting: false,
        });
    });

    it('loads the whole folder', async () => {
        mockRequst.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(0, PAGE_SIZE)) });
        mockRequst.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(PAGE_SIZE)) });
        await act(async () => {
            await hook.current.loadChildren(abortSignal, 'shareId', 'parentLinkId');
        });
        expect(mockRequst.mock.calls.map(([{ params }]) => params)).toMatchObject([
            { Page: 0, Sort: 'CreateTime', Desc: 0 },
            { Page: 1, Sort: 'CreateTime', Desc: 0 },
        ]);
    });

    it('continues the load of the whole folder where it ended', async () => {
        mockRequst.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(0, PAGE_SIZE)) });
        mockRequst.mockReturnValueOnce({ Links: linksToApiLinks(LINKS.slice(PAGE_SIZE)) });
        await act(async () => {
            await hook.current.fetchChildrenNextPage(abortSignal, 'shareId', 'parentLinkId', {
                sortField: 'metaDataModifyTime', // Make sure it is not default.
                sortOrder: SORT_DIRECTION.ASC,
            });
            await hook.current.loadChildren(abortSignal, 'shareId', 'parentLinkId');
        });
        expect(mockRequst.mock.calls.map(([{ params }]) => params)).toMatchObject([
            { Page: 0, Sort: 'ModifyTime', Desc: 0 }, // Done by fetchChildrenNextPage.
            { Page: 1, Sort: 'ModifyTime', Desc: 0 }, // Done by loadChildren, continues with the same sorting.
        ]);
    });
});
