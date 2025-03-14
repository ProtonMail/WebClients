import { useSubscribeEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

import { useMailDispatch, useMailSelector, useMailStore } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import type { Element } from '../../models/element';
import type { ConversationEvent, ElementEvent, Event, MessageEvent } from '../../models/event';
import { eventUpdates, invalidate } from '../../store/elements/elementsActions';
import {
    isES as isESSelector,
    shouldInvalidateElementsState as shouldInvalidateElementsStateSelector,
    taskRunning as taskRunningSelector,
} from '../../store/elements/elementsSelectors';
import type { EventUpdates } from '../../store/elements/elementsTypes';

export const useElementsEvents = (conversationMode: boolean, search: SearchParameters) => {
    const { esStatus } = useEncryptedSearchContext();

    const store = useMailStore();
    const dispatch = useMailDispatch();
    const shouldInvalidateElementsState = useMailSelector(shouldInvalidateElementsStateSelector);
    const isES = useMailSelector((state) => isESSelector(state, { search, esStatus }));
    const taskRunning = useMailSelector(taskRunningSelector);

    // Listen to event manager and update the cache
    useSubscribeEventManager(async ({ Conversations = [], Messages = [] }: Event) => {
        const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;

        // If it's an encrypted search, its event manager will deal with the change
        if (isES) {
            return;
        }

        if (!Elements.length) {
            return;
        }

        if (shouldInvalidateElementsState) {
            dispatch(invalidate());
            return;
        }

        const {
            toCreate,
            toUpdate: toUpdateOrLoad,
            toDelete,
        } = Elements.reduce<Pick<EventUpdates, 'toCreate' | 'toUpdate' | 'toDelete'>>(
            ({ toCreate, toUpdate, toDelete }, event) => {
                const { ID, Action } = event;
                const Element = conversationMode
                    ? (event as ConversationEvent).Conversation
                    : (event as MessageEvent).Message;

                if (Action === EVENT_ACTIONS.CREATE) {
                    toCreate.push(Element as Element);
                } else if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                    toUpdate.push(Element as Element);
                } else if (Action === EVENT_ACTIONS.DELETE) {
                    toDelete.push(ID);
                }

                return { toCreate, toUpdate, toDelete };
            },
            { toCreate: [], toUpdate: [], toDelete: [] }
        );

        // Not the elements ids "in view" but all in the cache
        const elementIDs = Object.keys(store.getState().elements.elements);

        const { toUpdate, toLoad } = toUpdateOrLoad.reduce<Pick<EventUpdates, 'toUpdate' | 'toLoad'>>(
            ({ toUpdate, toLoad }, element) => {
                const existingElement = elementIDs.includes(element.ID || '');

                if (existingElement) {
                    toUpdate.push(element);
                } else if (taskRunning.labelIDs.length === 0) {
                    // Long tasks trigger too much element update to be able to load them all
                    toLoad.push(element);
                } else {
                    // We can't lose the element, so we create it
                    toCreate.push(element);
                }

                return { toUpdate, toLoad };
            },
            { toUpdate: [], toLoad: [] }
        );

        void dispatch(eventUpdates({ conversationMode, toCreate, toUpdate, toLoad, toDelete }));
    });
};
