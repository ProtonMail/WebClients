import { useApi, useSubscribeEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { EventUpdates } from '../../logic/elements/elementsTypes';
import { ElementEvent, Event, ConversationEvent, MessageEvent } from '../../models/event';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { eventUpdates, invalidate } from '../../logic/elements/elementsActions';
import { isLive as isLiveSelector, isES as isESSelector } from '../../logic/elements/elementsSelectors';
import { Element } from '../../models/element';
import { RootState } from '../../logic/store';
import { SearchParameters } from '../../models/tools';

export const useElementsEvents = (conversationMode: boolean, search: SearchParameters) => {
    const api = useApi();
    const { getESDBStatus } = useEncryptedSearchContext();
    const esDBStatus = getESDBStatus();

    const store = useStore<RootState>();
    const dispatch = useDispatch();
    const isLive = useSelector(isLiveSelector);
    const isES = useSelector((state: RootState) => isESSelector(state, { search, esDBStatus }));

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

        if (!isLive) {
            if (Elements.length) {
                dispatch(invalidate());
            }
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
                    toUpdate.push({ ID, ...Element });
                } else if (Action === EVENT_ACTIONS.DELETE) {
                    toDelete.push(ID);
                }

                return { toCreate, toUpdate, toDelete };
            },
            { toCreate: [], toUpdate: [], toDelete: [] }
        );

        // Not the elements ids "in view" but all in the cache
        const elementIDs = Object.keys(store.getState().elements.elements);

        const { toUpdate, toLoad } = toUpdateOrLoad
            .filter(({ ID = '' }) => !toDelete.includes(ID)) // No need to get deleted element
            .reduce<Pick<EventUpdates, 'toUpdate' | 'toLoad'>>(
                ({ toUpdate, toLoad }, element) => {
                    const existingElement = elementIDs.includes(element.ID || '');

                    if (existingElement) {
                        toUpdate.push(element);
                    } else {
                        toLoad.push(element.ID || '');
                    }

                    return { toUpdate, toLoad };
                },
                { toUpdate: [], toLoad: [] }
            );

        void dispatch(eventUpdates({ api, conversationMode, toCreate, toUpdate, toLoad, toDelete }));
    });
};
