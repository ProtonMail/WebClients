import { useApi, useSubscribeEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { useDispatch, useSelector } from 'react-redux';
import { EventUpdates, Search } from '../../logic/elements/elementsTypes';
import { ElementEvent, Event, ConversationEvent, MessageEvent } from '../../models/event';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch } from '../../helpers/elements';
import { eventUpdates, invalidate } from '../../logic/elements/elementsActions';
import { isLive as isLiveSelector, elementIDs as elementIDsSelector } from '../../logic/elements/elementsSelectors';
import { Element } from '../../models/element';

export const useElementsEvents = (conversationMode: boolean, search: Search) => {
    const api = useApi();
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isCacheLimited } = getESDBStatus();
    const useES = dbExists && esEnabled && isSearch(search) && (!!search.keyword || !isCacheLimited);

    const dispatch = useDispatch();
    const elementIDs = useSelector(elementIDsSelector);
    const isLive = useSelector(isLiveSelector);

    // Listen to event manager and update de cache
    useSubscribeEventManager(async ({ Conversations = [], Messages = [] }: Event) => {
        const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;

        // If it's an encrypted search, its event manager will deal with the change
        if (useES) {
            return;
        }

        if (!Elements.length) {
            return;
        }

        if (!isLive) {
            if (Elements.length) {
                // setCache((cache) => ({ ...cache, invalidated: true }));
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

        // const toUpdateCompleted = (
        //     await Promise.all(
        //         toUpdate
        //             .filter(({ ID = '' }) => !toDelete.includes(ID)) // No need to get deleted element
        //             .map(async (element) => {
        //                 const elementID = element.ID || '';
        //                 const existingElement = cache.elements[elementID];

        //                 if (existingElement) {
        //                     element = parseLabelIDsInEvent(existingElement, element);
        //                 }

        //                 return existingElement
        //                     ? { ...existingElement, ...element }
        //                     : queryElement(elementID).catch(noop);
        //             })
        //     )
        // ).filter(isTruthy);

        const { toUpdate, toLoad } = toUpdateOrLoad
            .filter(({ ID = '' }) => !toDelete.includes(ID)) // No need to get deleted element
            .reduce<Pick<EventUpdates, 'toUpdate' | 'toLoad'>>(
                ({ toUpdate, toLoad }, element) => {
                    // const elementID = element.ID || '';
                    // const existingElement = cache.elements[elementID];
                    const existingElement = elementIDs.includes(element.ID);

                    if (existingElement) {
                        // element = parseLabelIDsInEvent(existingElement, element);
                        toUpdate.push(element);
                    } else {
                        toLoad.push(element.ID || '');
                    }

                    // return existingElement ? { ...existingElement, ...element } : queryElement(elementID).catch(noop);
                    return { toUpdate, toLoad };
                },
                { toUpdate: [], toLoad: [] }
            );

        // setCache((cache) => {
        //     const newReplacements: { [ID: string]: Element } = {};

        //     [...toCreate, ...toUpdateCompleted].forEach((element) => {
        //         newReplacements[element.ID || ''] = element;
        //     });
        //     const newElements = {
        //         ...cache.elements,
        //         ...newReplacements,
        //     };
        //     toDelete.forEach((elementID) => {
        //         delete newElements[elementID];
        //     });

        //     return {
        //         ...cache,
        //         elements: newElements,
        //     };
        // });
        void dispatch(eventUpdates({ api, conversationMode, toCreate, toUpdate, toLoad, toDelete }));
    });
};
