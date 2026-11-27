import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import type { MailState } from '../../store';
import { newElementsState } from '../elementsInitialState';
import {
    addESResults,
    eventUpdatesPending,
    optimisticDelete,
    optimisticRestoreDeletedIDs,
    optimisticUpdates,
    setParams,
    showSerializedElements,
} from '../elementsReducers';
import { elements as elementsSelector } from '../elementsSelectors';
import type { ElementsState, ElementsStateParams, EventUpdates } from '../elementsTypes';

const message = (ID: string) =>
    ({
        ID,
        ConversationID: `conversation-${ID}`,
        Time: 1,
        Unread: 0,
        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
    }) as unknown as Message;

const toMailState = (state: ElementsState) =>
    ({
        elements: state,
        mailSettings: { value: { PageSize: MAIL_PAGE_SIZE.FIFTY } },
        addresses: { value: [] },
    }) as unknown as MailState;

const events = (arg: Partial<EventUpdates>): PayloadAction<undefined, string, { arg: EventUpdates }> => ({
    type: 'elements/eventUpdates/pending',
    payload: undefined,
    meta: { arg: { conversationMode: false, toCreate: [], toUpdate: [], toLoad: [], toDelete: [], ...arg } },
});

describe('optimistic delete tombstones', () => {
    let state: Draft<ElementsState>;
    const params: ElementsStateParams = {
        ...newElementsState().params,
        conversationMode: false,
        search: { keyword: 'invoice' },
    };

    const deliver = (ordered: boolean) =>
        addESResults(state, {
            type: 'elements/addESResults',
            payload: {
                page: 0,
                elements: [message('a'), message('b')],
                params,
                pageSize: MAIL_PAGE_SIZE.FIFTY,
                ordered,
            },
        });

    const deleteA = () =>
        optimisticDelete(state, { type: 'elements/optimistic/delete', payload: { elementIDs: ['a'] } });

    beforeEach(() => {
        state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
        deliver(true);
        deleteA();
    });

    it('does not bring an element back when an ordered search delivers it again', () => {
        deliver(true);

        expect(elementsSelector(toMailState(state)).map(({ ID }) => ID)).toEqual(['b']);
    });

    it('keeps an element out of an ordered search result when an event brings a copy back', () => {
        eventUpdatesPending(state, events({ toCreate: [message('a')] }));

        expect(elementsSelector(toMailState(state)).map(({ ID }) => ID)).toEqual(['b']);
    });

    it('leaves unordered results, page loads and events as they were', () => {
        deliver(false);
        expect(state.elements.a).toBeDefined();

        delete state.elements.a;
        showSerializedElements(state, {
            type: 'elements/showSerializedElements',
            payload: {
                result: { abortController: new AbortController(), Total: 1, Elements: [message('a')], Stale: 0 },
                page: 0,
                params: newElementsState().params,
            },
        });
        expect(state.elements.a).toBeDefined();

        delete state.elements.a;
        eventUpdatesPending(state, events({ toCreate: [message('a')] }));
        expect(state.elements.a).toBeDefined();
    });

    it('forgets the element once the delete event arrives', () => {
        eventUpdatesPending(state, events({ toDelete: ['a'] }));

        expect(state.optimisticallyDeletedIDs).toEqual({});
    });

    it('brings the element back when the deletion is rolled back', () => {
        optimisticUpdates(state, { type: 'elements/optimistic/restoreDelete', payload: { elements: [message('a')] } });
        deliver(true);

        expect(state.optimisticallyDeletedIDs).toEqual({});
        expect(elementsSelector(toMailState(state)).map(({ ID }) => ID)).toEqual(['a', 'b']);
    });

    it('forgets every rolled back element, also those that were not in state to be restored', () => {
        optimisticDelete(state, { type: 'elements/optimistic/delete', payload: { elementIDs: ['uncached'] } });

        optimisticRestoreDeletedIDs(state, {
            type: 'elements/optimistic/restoreDeletedIDs',
            payload: ['a', 'uncached'],
        });

        expect(state.optimisticallyDeletedIDs).toEqual({});
    });

    it('forgets the elements when moving to another list, e.g. one the backend soft-deleted them into', () => {
        setParams(state, {
            type: 'elements/setParams',
            payload: { labelID: MAILBOX_LABEL_IDS.SOFT_DELETED, search: {} },
        });

        expect(state.optimisticallyDeletedIDs).toEqual({});
    });

    it('keeps the elements when the list stays the same', () => {
        setParams(state, { type: 'elements/setParams', payload: { ...params } });

        expect(state.optimisticallyDeletedIDs).toEqual({ a: true });
    });
});
