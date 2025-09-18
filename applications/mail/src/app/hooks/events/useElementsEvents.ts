import { useSubscribeEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import { useMailDispatch, useMailSelector, useMailStore } from 'proton-mail/store/hooks';

import type { Element } from '../../models/element';
import type { ConversationEvent, Event, MessageEvent } from '../../models/event';
import { eventUpdates, invalidate } from '../../store/elements/elementsActions';
import {
    shouldInvalidateElementsState as shouldInvalidateElementsStateSelector,
    taskRunning as taskRunningSelector,
} from '../../store/elements/elementsSelectors';

const elementExists = (elementsState: ElementsState, ID: string): boolean => {
    return !!elementsState.elements[ID];
};

export const processElementEvents = ({
    conversationEvents,
    messageEvents,
    elementsState,
    isTaskRunning,
}: {
    conversationEvents: ConversationEvent[];
    messageEvents: MessageEvent[];
    elementsState: ElementsState;
    isTaskRunning: boolean;
}) => {
    const toCreate: Element[] = [];
    const toUpdate: Element[] = [];
    const toLoad: Element[] = [];
    const toDelete: string[] = [];

    const handleCreate = (element: Element) => {
        toCreate.push(element);

        // Long tasks trigger too much element update to be able to load them all
        if (isTaskRunning) {
            toLoad.push(element);
        }
    };

    const handleUpdateMetadata = (element: Element) => {
        if (elementExists(elementsState, element.ID)) {
            toUpdate.push(element);
        } else {
            handleCreate(element);
        }
    };

    conversationEvents.forEach(({ ID, Action, Conversation }) => {
        if (Action === EVENT_ACTIONS.CREATE) {
            handleCreate(Conversation as Element);
        } else if (Action === EVENT_ACTIONS.UPDATE) {
            handleUpdateMetadata(Conversation as Element);
        } else if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            // This can happen when a conversation is moved to trash or marked as read/unread
            handleUpdateMetadata(Conversation as Element);
        } else if (Action === EVENT_ACTIONS.DELETE) {
            toDelete.push(ID);
        }
    });

    messageEvents.forEach(({ ID, Action, Message }) => {
        if (Action === EVENT_ACTIONS.CREATE) {
            handleCreate(Message as Element);
        } else if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
            // Concern update for draft, so we need to load the latest version of the message body
            toLoad.push(Message as Element);
        } else if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            // Only concern message metadata
            handleUpdateMetadata(Message as Element);
        } else if (Action === EVENT_ACTIONS.DELETE) {
            toDelete.push(ID);
        }
    });

    return { toCreate, toUpdate, toLoad, toDelete };
};

export const useElementsEvents = (conversationMode: boolean) => {
    const store = useMailStore();
    const dispatch = useMailDispatch();
    const shouldInvalidateElementsState = useMailSelector(shouldInvalidateElementsStateSelector);
    const taskRunning = useMailSelector(taskRunningSelector);

    // Listen to event manager and update the cache
    useSubscribeEventManager(({ Conversations: conversationEvents = [], Messages: messageEvents = [] }: Event) => {
        if (!conversationEvents.length && !messageEvents.length) {
            return;
        }

        if (shouldInvalidateElementsState) {
            dispatch(invalidate());
            return;
        }

        const { toCreate, toUpdate, toLoad, toDelete } = processElementEvents({
            conversationEvents,
            messageEvents,
            elementsState: store.getState().elements,
            isTaskRunning: taskRunning.labelIDs.length === 0,
        });

        void dispatch(eventUpdates({ conversationMode, toCreate, toUpdate, toLoad, toDelete }));
    });
};
