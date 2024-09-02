import { act, renderHook } from '@testing-library/react-hooks';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import { CryptoProxy } from '@proton/crypto/lib';

import { useBookmarks } from '../../_bookmarks/useBookmarks';
import { useShare } from '../../_shares';
import { useDecryptPublicShareLink } from '../../_shares/useDecryptPublicShareLink';
import useLinksState from '../useLinksState';
import { useBookmarksLinksListing } from './useBookmarksLinksListing';
import { useLinksListingHelpers } from './useLinksListingHelpers';

jest.mock('@proton/crypto');
const mockedDecryptMessage = jest.mocked(CryptoProxy.decryptMessage);

jest.mock('../../_bookmarks/useBookmarks');
const mockedListBookmarks = jest.fn().mockResolvedValue([]);
const mockedAddBookmarks = jest.fn().mockResolvedValue({});
jest.mocked(useBookmarks).mockReturnValue({
    listBookmarks: mockedListBookmarks,
    addBookmark: mockedAddBookmarks,
    deleteBookmark: jest.fn().mockResolvedValue({}),
} as any);

jest.mock('../../_shares/useShare');
const mockedPrivateKey = 'PrimaryPrivateKey';
const mockedGetShareCreatorKeys = jest.fn().mockResolvedValue({ privateKey: mockedPrivateKey });
jest.mocked(useShare).mockReturnValue({
    getShareCreatorKeys: mockedGetShareCreatorKeys,
} as any);

jest.mock('../../_shares/useDecryptPublicShareLink');
const mockedDecryptPublicShareLink = jest.fn();
jest.mocked(useDecryptPublicShareLink).mockReturnValue({
    decryptPublicShareLink: mockedDecryptPublicShareLink,
});

jest.mock('../useLinksState');
const mockedGetAllShareLinks = jest.fn();
const mockedGetLink = jest.fn();
const mockedRemoveLinkForSharedWithMe = jest.fn();
jest.mocked(useLinksState).mockReturnValue({
    getAllShareLinks: mockedGetAllShareLinks,
    getLink: mockedGetLink,
    removeLinkForSharedWithMe: mockedRemoveLinkForSharedWithMe,
} as any);

jest.mock('./useLinksListingHelpers');
const mockedGetDecryptLinksAndDecryptTheRest = jest.fn();
jest.mocked(useLinksListingHelpers).mockReturnValue({
    getDecryptedLinksAndDecryptRest: mockedGetDecryptLinksAndDecryptTheRest,
} as any);

const mockedLinkId = 'linkId';
const urlPassword = 'urlPassword';
const bookmark = {
    encryptedUrlPassword: 'encryptedUrlPassword',
    createTime: 1724688201,
    token: {
        Token: 'B2DP1EEBRW',
        linkID: mockedLinkId,
    },
};

const mockedDecryptedLink = {
    linkId: mockedLinkId,
    rootShareId: bookmark.token.Token,
};
const mockedShareId = 'contextShareId';

describe('useBookmarksLinksListing', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        mockedListBookmarks.mockResolvedValueOnce([bookmark]);
        mockedDecryptMessage.mockResolvedValueOnce({ data: urlPassword } as any);
        when(mockedDecryptPublicShareLink)
            .calledWith(expect.any(AbortSignal), {
                urlPassword,
                token: bookmark.token.Token,
                shareUrlInfo: bookmark.token,
                publicPage: false,
                additionnalDecryptedLinkInfo: {
                    sharedOn: bookmark.createTime,
                    signatureIssues: undefined,
                },
            })
            .mockResolvedValueOnce(mockedDecryptedLink);

        when(mockedGetDecryptLinksAndDecryptTheRest).calledWith(
            expect.any(AbortSignal),
            bookmark.token.Token,
            expect.any(Function)
        );
        mockedGetDecryptLinksAndDecryptTheRest.mockReturnValueOnce({
            links: [mockedDecryptedLink],
            isDecrypting: true,
        });
    });

    afterAll(() => {
        verifyAllWhenMocksCalled();
    });

    it('Should load bookmarks links and cached them ', async () => {
        when(mockedGetAllShareLinks)
            .calledWith(bookmark.token.Token)
            .mockReturnValueOnce([{ decrypted: mockedDecryptedLink, encrypted: mockedDecryptedLink }]);

        const { result } = renderHook(() => useBookmarksLinksListing());
        await act(async () => {
            await result.current.loadLinksBookmarks(new AbortController().signal, mockedShareId);
        });

        expect(result.current.getCachedBookmarksLinks(new AbortController().signal)).toEqual({
            links: [mockedDecryptedLink],
            isDecrypting: true,
        });

        expect(result.current.getCachedBookmarkDetails(bookmark.token.Token)).toEqual({
            urlPassword,
            token: bookmark.token.Token,
            createTime: bookmark.createTime,
        });
    });

    it('should remove cached bookmark link', async () => {
        const { result } = renderHook(() => useBookmarksLinksListing());
        await act(async () => {
            await result.current.loadLinksBookmarks(new AbortController().signal, mockedShareId);
        });

        expect(result.current.getCachedBookmarkDetails(bookmark.token.Token)).toEqual({
            urlPassword,
            token: bookmark.token.Token,
            createTime: bookmark.createTime,
        });

        act(() => {
            result.current.removeCachedBookmarkLink(bookmark.token.Token, mockedLinkId);
        });

        expect(mockedRemoveLinkForSharedWithMe).toHaveBeenCalledWith(bookmark.token.Token, mockedLinkId);

        expect(result.current.getCachedBookmarkDetails(bookmark.token.Token)).toEqual(undefined);
    });
});
