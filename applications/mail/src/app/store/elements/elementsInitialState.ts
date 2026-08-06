import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { ElementsState, ElementsStateParams, NewStateParams, TaskRunningInfo } from './elementsTypes';

export const newElementsState = ({
    page = 0,
    params = {},
    retry = { payload: null, count: 0, error: undefined },
    beforeFirstLoad = true,
    taskRunning = { labelIDs: [], timeoutID: undefined },
}: NewStateParams & { taskRunning?: TaskRunningInfo } = {}): ElementsState => {
    const defaultParams: ElementsStateParams = {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        conversationMode: true,
        categoryIDs: [],
        filter: {},
        sort: { sort: 'Time', desc: true },
        search: {},
        esEnabled: false,
        isSearching: false,
    };

    return {
        beforeFirstLoad,
        invalidated: false,
        pendingRequest: false,
        pendingActions: 0,
        pendingESSearches: 0,
        usedEncryptedSearch: undefined,
        params: { ...defaultParams, ...params },
        page,
        total: {},
        elements: {},
        pages: {},
        bypassFilter: [],
        retry,
        taskRunning,
        awaitingStaleRetry: {},
        deletedSinceLastLoad: 0,
    };
};
