import { useCallback, useRef, useState } from 'react';

import { CryptoProxy } from '@proton/crypto/lib';

import { useBookmarks } from '../../_bookmarks/useBookmarks';
import { type DecryptedLink } from '../../_links';
import { useShare } from '../../_shares';
import { useDecryptPublicShareLink } from '../../_shares/useDecryptPublicShareLink';
import useLinksState, { isLinkDecrypted } from '../useLinksState';
import { useLinksListingHelpers } from './useLinksListingHelpers';

export const useBookmarksLinksListing = () => {
    const { listBookmarks } = useBookmarks();
    const [bookmarksDetails, setBookmarksDetails] = useState<
        Map<string, { token: string; urlPassword: string; createTime: number }>
    >(new Map());
    const { getShareCreatorKeys } = useShare();
    const { decryptPublicShareLink } = useDecryptPublicShareLink();
    const tokensState = useRef<Set<string>>();
    const { getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
    const linksState = useLinksState();

    const setTokensState = (tokens: string[]) => {
        const tokensSet = tokensState.current || new Set();

        for (const token of tokens) {
            tokensSet.add(token);
        }

        tokensState.current = tokensSet;
        return tokensState.current;
    };

    const getTokensState = (): string[] => Array.from(tokensState.current || new Set());

    const loadLinksBookmarks = async (abortSignal: AbortSignal, shareId: string) => {
        const bookmarks = await listBookmarks(abortSignal);
        const { privateKey } = await getShareCreatorKeys(abortSignal, shareId);
        const bookmarksWithLink = [];
        for (let bookmark of bookmarks) {
            // If the bookmark link is already loaded and decrypted, we don't need to do it again
            const link = linksState.getLink(bookmark.token.Token, bookmark.token.LinkID);

            const { data: urlPassword } = await CryptoProxy.decryptMessage({
                armoredMessage: bookmark.encryptedUrlPasword,
                decryptionKeys: privateKey,
            });
            if (!urlPassword) {
                throw new Error("Can't Decrypt urlPassword");
            }
            const decryptedLink = isLinkDecrypted(link)
                ? link.decrypted
                : await decryptPublicShareLink(abortSignal, {
                      urlPassword,
                      token: bookmark.token.Token,
                      shareUrlInfo: bookmark.token,
                      publicPage: false,
                      additionnalDecryptedLinkInfo: {
                          sharedOn: bookmark.createTime,
                          signatureIssues: undefined, // There is no signature check on public shared files
                      },
                  });

            bookmarksWithLink.push({
                link: decryptedLink,
                token: bookmark.token.Token,
                urlPassword,
                createTime: bookmark.createTime,
            });
        }
        setTokensState(bookmarksWithLink.map(({ token }) => token));
        setBookmarksDetails(
            new Map(
                bookmarksWithLink.map(({ token, createTime, urlPassword }) => [
                    token,
                    { token, createTime, urlPassword },
                ])
            )
        );
    };

    /**
     * Gets bookmarks that have already been fetched and cached.
     */
    const getCachedBookmarksLinks = useCallback(
        (abortSignal: AbortSignal): { links: DecryptedLink[]; isDecrypting: boolean } => {
            const associatedTokens = getTokensState();
            const result = associatedTokens.map((token) => {
                return getDecryptedLinksAndDecryptRest(abortSignal, token, linksState.getAllShareLinks(token));
            });

            const links = result.reduce<DecryptedLink[]>((acc, element) => {
                return [...acc, ...element.links];
            }, []);

            const isDecrypting = result.some((element) => {
                return element.isDecrypting;
            });

            return {
                links,
                isDecrypting,
            };
        },
        [linksState.getAllShareLinks]
    );

    const getCachedBookmarkDetails = useCallback(
        (token: string) => {
            return bookmarksDetails.get(token);
        },
        [bookmarksDetails]
    );

    // TODO: Remove this when we will have events
    const removeCachedBookmarkLink = (token: string, linkId: string) => {
        setBookmarksDetails((prevState) => {
            prevState.delete(token);
            const newState = new Map(prevState);
            return newState;
        });
        linksState.removeLinkForSharedWithMe(token, linkId);
    };

    return {
        getCachedBookmarkDetails,
        getCachedBookmarksLinks,
        removeCachedBookmarkLink,
        loadLinksBookmarks,
    };
};
