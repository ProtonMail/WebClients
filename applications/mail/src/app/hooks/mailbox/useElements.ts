import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useConversationCounts, useGetConversationCounts } from '@proton/mail/counts/conversationCounts';
import { useGetMessageCounts, useMessageCounts } from '@proton/mail/counts/messageCounts';
import { useFolders, useLabels } from '@proton/mail/labels/hooks';
import { CacheType } from '@proton/redux-utilities';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { omit } from '@proton/shared/lib/helpers/object';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Label, MailSettings } from '@proton/shared/lib/interfaces';
import { HUMAN_TO_LABEL_IDS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import { extractSearchParameters, filterFromUrl, filterToString, sortFromUrl } from 'proton-mail/helpers/mailboxUrl';
import { useMailDispatch, useMailSelector, useMailStore } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch } from '../../helpers/elements';
import { pageCount } from '../../helpers/paging';
import type { Element } from '../../models/element';
import { conversationByID } from '../../store/conversations/conversationsSelectors';
import {
    load as loadAction,
    removeExpired,
    reset,
    resetByPassFilter,
    setPageSize,
    setParams,
    updatePage,
} from '../../store/elements/elementsActions';
import {
    dynamicTotal as dynamicTotalSelector,
    elementIDs as elementIDsSelector,
    elementsMap as elementsMapSelector,
    elements as elementsSelector,
    expectingEmpty as expectingEmptySelector,
    loadedEmpty as loadedEmptySelector,
    loading as loadingSelector,
    messagesToLoadMoreES as messagesToLoadMoreESSelector,
    pageIsConsecutive as pageIsConsecutiveSelector,
    params as paramsSelector,
    partialESSearch as partialESSearchSelector,
    pendingActions as pendingActionsSelector,
    placeholderCount as placeholderCountSelector,
    shouldLoadElements as shouldLoadElementsSelector,
    shouldUpdatePage as shouldUpdatePageSelector,
    stateInconsistency as stateInconsistencySelector,
    taskRunning,
    totalReturned as totalReturnedSelector,
} from '../../store/elements/elementsSelectors';
import { messageByID } from '../../store/messages/messagesSelectors';
import type { MailState } from '../../store/store';
import { useElementsEvents } from '../events/useElementsEvents';
import { useExpirationCheck } from '../useExpirationCheck';

const getParametersFromPath = (pathname: string) => {
    const pathSegments = pathname.split('/').filter(Boolean);

    return {
        rawLabelID: pathSegments[0] || undefined,
        elementID: pathSegments[1] || undefined,
        messageID: pathSegments[2] || undefined,
    };
};

const getLabelIDFromRawID = (labelIDs: string[], rawID?: string) => {
    if (!rawID) {
        rawID = LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX];
    }

    return HUMAN_TO_LABEL_IDS[rawID] || (labelIDs.includes(rawID) ? rawID : undefined);
};

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: number;
    pageSize: MAIL_PAGE_SIZE;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    onPage: (page: number) => void;
    mailSettings: MailSettings;
}

export interface ElementsStructure {
    labelID: string;
    elements: Element[];
    elementIDs: string[];
    placeholderCount: number;
    loading: boolean;
    total: number | undefined;
}

interface UseElements {
    (options: Options): ElementsStructure;
}

export const useElements: UseElements = ({
    conversationMode,
    labelID,
    search,
    page,
    pageSize,
    sort,
    filter,
    onPage,
    mailSettings,
}) => {
    const store = useMailStore();
    const dispatch = useMailDispatch();
    const canReactToSettingsUpdate = useRef(false);

    const abortControllerRef = useRef<AbortController>();
    const history = useHistory();
    const location = useLocation();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const [conversationCounts = [], loadingConversationCounts] = useConversationCounts();
    const [messageCounts = [], loadingMessageCounts] = useMessageCounts();
    const countValues = conversationMode ? conversationCounts : messageCounts;
    const countsLoading = conversationMode ? loadingConversationCounts : loadingMessageCounts;

    const { esStatus } = useEncryptedSearchContext();
    const { esEnabled } = esStatus;

    const counts = { counts: countValues, loading: countsLoading };

    const stateParams = useMailSelector(paramsSelector);
    const elementsMap = useMailSelector(elementsMapSelector);
    const pendingActions = useMailSelector(pendingActionsSelector);
    const tasksRunning = useMailSelector(taskRunning);
    const elements = useMailSelector(elementsSelector);
    const elementIDs = useMailSelector(elementIDsSelector);
    const pageIsConsecutive = useMailSelector((state: MailState) => pageIsConsecutiveSelector(state, { page }));
    const messagesToLoadMoreES = useMailSelector((state: MailState) =>
        messagesToLoadMoreESSelector(state, { page, search, esStatus })
    );
    const shouldLoadElements = useMailSelector((state: MailState) => shouldLoadElementsSelector(state, { page }));
    const shouldUpdatePage = useMailSelector((state: MailState) => shouldUpdatePageSelector(state, { page }));
    const dynamicTotal = useMailSelector((state: MailState) => dynamicTotalSelector(state, { counts }));
    const placeholderCount = useMailSelector((state: MailState) => placeholderCountSelector(state, { counts }));
    const loading = useMailSelector((state: MailState) => loadingSelector(state, { page }));
    const totalReturned = useMailSelector((state: MailState) => totalReturnedSelector(state, { counts }));
    const expectingEmpty = useMailSelector((state: MailState) => expectingEmptySelector(state, { counts }));
    const loadedEmpty = useMailSelector(loadedEmptySelector);
    const partialESSearch = useMailSelector((state: MailState) => partialESSearchSelector(state, { search, esStatus }));
    const stateInconsistency = useMailSelector((state: MailState) =>
        stateInconsistencySelector(state, { search, esStatus })
    );
    const getConversationCounts = useGetConversationCounts();
    const getMessageCounts = useGetMessageCounts();

    // Remove from cache expired elements
    useExpirationCheck(Object.values(elementsMap), (elements) => {
        if (!elements.length) {
            return;
        }
        elements.forEach((element) => dispatch(removeExpired(element)));
        getConversationCounts({ cache: CacheType.None }).catch(noop);
        getMessageCounts({ cache: CacheType.None }).catch(noop);
    });

    const labelIDs = useMemo(() => {
        return [...labels, ...folders].map(({ ID }: Label) => ID);
    }, [labels.length, folders.length]);

    useEffect(() => {
        const { rawLabelID, elementID, messageID } = getParametersFromPath(location.pathname);

        if (!rawLabelID) {
            history.replace(location.pathname + LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]);
        }

        const labelID = getLabelIDFromRawID(labelIDs, rawLabelID);
        const sort = sortFromUrl(location, labelID);
        const filter = filterFromUrl(location);
        const search = extractSearchParameters(location);
        const isSearching = isSearch(search);
        const conversationMode = isConversationMode(labelID, mailSettings, location);

        const shouldResetElementsState =
            search.keyword !== stateParams.search.keyword || // Reset the cache since we do not support client search (filtering)
            (esEnabled !== stateParams.esEnabled && isSearch(search)) ||
            !pageIsConsecutive ||
            // Reset the cache when sort changes to ensure correct ordering
            !isDeepEqual(sort, stateParams.sort);

        if (shouldResetElementsState) {
            dispatch(
                reset({
                    page,
                    pageSize,
                    params: {
                        labelID,
                        elementID,
                        messageID,
                        sort,
                        filter,
                        search,
                        conversationMode,
                        isSearching,
                    },
                })
            );
        } else {
            // If we can update the total directly on params update, do it.
            // In some cases we cannot predict the total, for example when applying the has file filter
            const locationTotal =
                !filterToString(filter) && !isSearching
                    ? countValues.find((label) => label.LabelID === labelID)?.Total
                    : undefined;
            dispatch(
                setParams({
                    labelID,
                    elementID,
                    messageID,
                    sort,
                    filter,
                    search,
                    conversationMode,
                    isSearching,
                    total: locationTotal,
                })
            );
        }
    }, [location.pathname, location.hash, mailSettings, labelIDs]);

    // Reset the element state when receiving a setting update for page size or conversation mode
    useEffect(() => {
        // Do not trigger a reset on the first render
        if (!canReactToSettingsUpdate.current) {
            canReactToSettingsUpdate.current = true;
            return;
        }

        dispatch(
            reset({
                page,
                pageSize,
                params: {
                    labelID,
                    conversationMode,
                    sort,
                    filter,
                    esEnabled,
                    search,
                    isSearching: isSearch(search),
                },
            })
        );
    }, [mailSettings.PageSize, mailSettings.ViewMode]);

    useEffect(() => {
        dispatch(setPageSize(MAIL_PAGE_SIZE.FIFTY));
    }, []);

    // If sort or filter is being updated, we can reset bypass filter value from the state, otherwise it could create
    // false placeholders when switching filters.
    useEffect(() => {
        dispatch(resetByPassFilter());
    }, [sort, filter]);

    // Main effect watching all inputs and responsible to trigger actions on the state
    useEffect(() => {
        // If we have actions pending OR select all actions pending, we don't want to load elements because it would cancel our optimistic updates
        const hasPendingActions = pendingActions > 0 || tasksRunning.labelIDs.includes(labelID);

        /**
         * To more load new elements, the user should either have `shouldLoadElements` true, no pending action AND not be in search,
         * OR change the page size for a bigger one (100 > 200)
         */
        if (shouldLoadElements && !hasPendingActions && !isSearch(search)) {
            void dispatch(
                loadAction({
                    abortController: abortControllerRef.current,
                    page,
                    pageSize,
                })
            );
        }

        if (shouldUpdatePage && messagesToLoadMoreES === 0) {
            dispatch(updatePage(page));
        }
    }, [
        shouldLoadElements,
        shouldUpdatePage,
        messagesToLoadMoreES,
        pendingActions,
        search,
        pageSize,
        labelID,
        tasksRunning,
    ]);

    // Move to the last page if the current one becomes empty
    useEffect(() => {
        if (page === 0) {
            return;
        }

        if (!partialESSearch && (expectingEmpty || loadedEmpty)) {
            const count = dynamicTotal ? pageCount(dynamicTotal, pageSize) : 0;
            if (count === 0) {
                onPage(0);
            } else if (page !== count - 1) {
                onPage(count - 1);
            }
        }
    }, [page, partialESSearch, expectingEmpty, loadedEmpty, dynamicTotal]);

    useEffect(() => {
        if (stateInconsistency) {
            if (!esEnabled) {
                const message = 'Elements list inconsistency error';
                const state = store.getState();
                const context = {
                    conversationMode,
                    labelID,
                    search,
                    // @ts-expect-error to fix later
                    page,
                    sort,
                    filter,
                    dynamicTotal,
                    state: omit(state, ['elements']),
                    ...state.elements, // Sentry limit depth in extra data, this optimize our feedback
                };
                console.error(message, context);
                captureMessage(message, { extra: { context } });
            }
            dispatch(
                reset({
                    page,
                    params: {
                        labelID,
                        sort,
                        filter,
                        esEnabled,
                        search,
                        conversationMode,
                        isSearching: isSearch(search),
                    },
                    beforeFirstLoad: !esEnabled && !!search.keyword,
                })
            );
        }
    }, [stateInconsistency]);

    useElementsEvents(conversationMode, search);

    return {
        labelID: stateParams.labelID,
        elements,
        elementIDs,
        placeholderCount,
        loading,
        total: totalReturned,
    };
};

/**
 * Returns the element in the elements state for the given elementID
 */
export const useGetElementByID = () => {
    const store = useMailStore();

    return useCallback((elementID: string): Element | undefined => {
        return store.getState().elements.elements[elementID];
    }, []);
};

/**
 * This helper will get as much data as we can on the ids whatever the location of the data
 * Don't use this for optimistic for example
 */
export const useGetElementsFromIDs = () => {
    const store = useMailStore();

    return useCallback((elementIDs: string[]): Element[] => {
        const state = store.getState();
        return elementIDs
            .map((ID: string) => {
                if (state.elements.elements[ID]) {
                    return state.elements.elements[ID];
                }

                const messageFromMessageState = messageByID(state, { ID });
                const conversationFromConversationState = conversationByID(state, { ID });

                return messageFromMessageState?.data || conversationFromConversationState?.Conversation;
            })
            .filter(isTruthy);
    }, []);
};

/**
 * Use this helper carefully since it might return a combination of objects from Element state and from Message state.
 * It is used to get messages from a list of IDs. If the object do exist in the Message state, we return it, otherwise the element is returned.
 */
export const useGetMessagesOrElementsFromIDs = () => {
    const store = useMailStore();

    return useCallback((elementIDs: string[]): Element[] => {
        const state = store.getState();
        return elementIDs
            .map((ID: string) => {
                const messageFromMessageState = messageByID(state, { ID });

                return messageFromMessageState?.data || state.elements.elements[ID];
            })
            .filter(isTruthy);
    }, []);
};
