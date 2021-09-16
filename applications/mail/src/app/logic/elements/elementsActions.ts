import { Draft } from 'immer';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { queryConversations } from '@proton/shared/lib/api/conversations';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { ElementsState, QueryParams, ResetAction } from './elementsTypes';
import { newState } from './elementsSlice';
import { ELEMENTS_CACHE_REQUEST_SIZE, PAGE_SIZE } from '../../constants';
import { RetryData } from '../../hooks/mailbox/useElementsCache';

export const resetState = (state: Draft<ElementsState>, action: ResetAction) => {
    console.log('reset', state, action);
    Object.assign(state, newState(action.payload));
};

const getQueryElementsParameters = ({ page, params: { labelID, sort, search, filter } }: QueryParams): any => ({
    Page: page,
    PageSize: PAGE_SIZE,
    Limit: ELEMENTS_CACHE_REQUEST_SIZE,
    LabelID: labelID,
    Sort: sort.sort,
    Desc: sort.desc ? 1 : 0,
    Begin: search.begin,
    End: search.end,
    // BeginID,
    // EndID,
    Keyword: search.keyword,
    To: search.to,
    From: search.from,
    // Subject,
    Attachments: search.attachments,
    Unread: filter.Unread,
    AddressID: search.address,
    // ID,
    AutoWildcard: search.wildcard,
});

const queryElements = async (
    api: Api,
    conversationMode: boolean,
    payload: any
): Promise<{ Total: number; Elements: Element[] }> => {
    // abortControllerRef.current?.abort();
    // abortControllerRef.current = new AbortController();
    const query = conversationMode ? queryConversations : queryMessageMetadata;

    const result: any = await api({ ...query(payload) /* , signal: abortControllerRef.current.signal */ });

    return {
        Total: result.Total,
        Elements: conversationMode ? result.Conversations : result.Messages,
    };
};

/**
 * A retry is the same request as before expecting a different result
 * @param payload: request params + expected total
 * @param error: optional error from last request
 */
const newRetry = (retry: RetryData, payload: any, error: Error | undefined) => {
    const count = error && isDeepEqual(payload, retry.payload) ? retry.count + 1 : 1;
    return { payload, count, error };
};

export const load = createAsyncThunk('load', async (queryParams: QueryParams) => {
    console.log('load', queryParams);
    const queryParameters = getQueryElementsParameters(queryParams);
    try {
        return await queryElements(queryParams.api, queryParams.conversationMode, queryParameters);
    } catch (error) {
        // Wait a couple of seconds before retrying
        setTimeout(() => {
            // setCache((cache) => ({
            //     ...cache,
            //     beforeFirstLoad: false,
            //     invalidated: false,
            //     pendingRequest: false,
            //     retry: newRetry(queryParameters, error),
            // }));
        }, 2000);
    }
});

export const loadStarted = (state: Draft<ElementsState>, action: { type: string; meta: any; payload: any }) => {
    console.log('loadStarted', state, action);
    state.pendingRequest = true;
    state.page = action.meta.arg.page;
};

export const loadSuccess = (state: Draft<ElementsState>, action: { type: string; meta: any; payload: any }) => {
    console.log('loadSuccess', state, action);

    const { page, params } = action.meta.arg;
    const { Total, Elements } = action.payload;

    Object.assign(state, {
        beforeFirstLoad: false,
        invalidated: false,
        pendingRequest: false,
        page,
        total: Total,
        retry: newRetry(state.retry, params, undefined),
    });
    state.pages.push(page);
    Object.assign(state.elements, toMap(Elements, 'ID'));
};
