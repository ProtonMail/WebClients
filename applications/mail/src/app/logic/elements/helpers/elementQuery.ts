import { getConversation, queryConversations } from '@proton/shared/lib/api/conversations';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';
import { ELEMENTS_CACHE_REQUEST_SIZE, PAGE_SIZE } from '../../../constants';
import { Element } from '../../../models/element';
import { QueryParams } from '../elementsTypes';

export const getQueryElementsParameters = ({ page, params: { labelID, sort, search, filter } }: QueryParams): any => ({
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

export const queryElements = async (
    api: Api,
    conversationMode: boolean,
    payload: QueryParams
): Promise<{ Total: number; Elements: Element[] }> => {
    // abortControllerRef.current?.abort();
    // abortControllerRef.current = new AbortController();
    const query = conversationMode ? queryConversations : queryMessageMetadata;

    const result: any = await api({ ...query(payload as any) /* , signal: abortControllerRef.current.signal */ });

    return {
        Total: result.Total,
        Elements: conversationMode ? result.Conversations : result.Messages,
    };
};

export const queryElement = async (api: Api, conversationMode: boolean, elementID: string): Promise<Element> => {
    const query = conversationMode ? getConversation : getMessage;
    const result: any = await api({ ...query(elementID), silence: true });
    return conversationMode ? result.Conversation : result.Message;
};
