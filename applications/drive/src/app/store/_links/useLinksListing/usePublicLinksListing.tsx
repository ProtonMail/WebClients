import { createContext, useCallback, useContext, useRef } from 'react';

import { querySharedURLChildren } from '@proton/shared/lib/api/drive/sharing';
import type { LinkChildrenResult } from '@proton/shared/lib/interfaces/drive/link';

import { linkMetaToEncryptedLink, usePublicSession } from '../../_api';
import type { DecryptedLink } from '../interface';
import useLinksState from '../useLinksState';
import type { FetchMeta, FetchResponse, SortParams } from './useLinksListingHelpers';
import { PAGE_SIZE, sortParamsToServerSortArgs, useLinksListingHelpers } from './useLinksListingHelpers';

type FetchState = {
    [token: string]: FetchTokenState;
};

type FetchTokenState = {
    [linkId: string]: FetchMeta;
};

/**
 * usePublicLinksListingProvider provides way to list publicly shared folder.
 * The typical usage should be similar as for useLinksListingProvider.
 */
export function usePublicLinksListingProvider() {
    const { request: publicRequest } = usePublicSession();
    const linksState = useLinksState();

    const { fetchNextPageWithSortingHelper, loadFullListing, getDecryptedLinksAndDecryptRest } =
        useLinksListingHelpers();
    const state = useRef<FetchState>({});

    /**
     * getTokenFetchState returns state for given `token`.
     * It ensures that the token is present in the state.
     */
    const getTokenFetchState = (token: string): FetchTokenState => {
        if (state.current[token]) {
            return state.current[token];
        }
        state.current[token] = {};
        return state.current[token];
    };

    const fetchPublicChildrenPage = async (
        abortSignal: AbortSignal,
        token: string,
        parentLinkId: string,
        sorting: SortParams,
        page: number,
        showNotification = true
    ): Promise<FetchResponse> => {
        const { Links } = await publicRequest<LinkChildrenResult>(
            {
                ...querySharedURLChildren(token, parentLinkId, {
                    ...sortParamsToServerSortArgs(sorting),
                    PageSize: PAGE_SIZE,
                    Page: page,
                }),
                silence: !showNotification,
            },
            abortSignal
        );
        return { links: Links.map((linkMeta) => linkMetaToEncryptedLink(linkMeta, '')), parents: [] };
    };

    const fetchPublicChildrenNextPage = async (
        abortSignal: AbortSignal,
        token: string,
        parentLinkId: string,
        sorting?: SortParams,
        showNotification = true
    ): Promise<boolean> => {
        const tokenState = getTokenFetchState(token);
        let linkFetchMeta = tokenState[parentLinkId];
        if (!linkFetchMeta) {
            linkFetchMeta = {};
            tokenState[parentLinkId] = linkFetchMeta;
        }

        return fetchNextPageWithSortingHelper(
            abortSignal,
            token,
            sorting,
            linkFetchMeta,
            (sorting: SortParams, page: number) => {
                return fetchPublicChildrenPage(abortSignal, token, parentLinkId, sorting, page, showNotification);
            },
            showNotification
        );
    };

    const loadChildren = async (
        abortSignal: AbortSignal,
        token: string,
        linkId: string,
        showNotification = true
    ): Promise<void> => {
        // undefined means keep the sorting used the last time = lets reuse what we loaded so far.
        const sorting = undefined;
        return loadFullListing(() =>
            fetchPublicChildrenNextPage(abortSignal, token, linkId, sorting, showNotification)
        );
    };

    const getCachedChildren = useCallback(
        (
            abortSignal: AbortSignal,
            token: string,
            parentLinkId: string,
            foldersOnly: boolean = false
        ): { links: DecryptedLink[]; isDecrypting: boolean } => {
            return getDecryptedLinksAndDecryptRest(
                abortSignal,
                token,
                linksState.getChildren(token, parentLinkId, foldersOnly),
                getTokenFetchState(token)[parentLinkId]
            );
        },
        [linksState.getChildren]
    );

    return {
        loadChildren,
        getCachedChildren,
    };
}

const PublicLinksListingContext = createContext<ReturnType<typeof usePublicLinksListingProvider> | null>(null);

export function PublicLinksListingProvider({ children }: { children: React.ReactNode }) {
    const value = usePublicLinksListingProvider();
    return <PublicLinksListingContext.Provider value={value}>{children}</PublicLinksListingContext.Provider>;
}

export default function useLinksListing() {
    const state = useContext(PublicLinksListingContext);
    if (!state) {
        throw new Error('Trying to use uninitialized PublicLinksListingProvider');
    }
    return state;
}
