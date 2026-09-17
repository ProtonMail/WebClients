import type { Draft } from '@reduxjs/toolkit';

import type { MailState } from '../../store';
import { retry } from '../elementsReducers';
import { selectLoading, shouldLoadElements } from '../elementsSelectors';
import { newElementsState } from '../elementsSlice';
import type { ElementsState } from '../elementsTypes';

describe('elementsReducers - retry', () => {
    let state: Draft<ElementsState>;

    beforeEach(() => {
        state = newElementsState() as Draft<ElementsState>;
    });

    const toMailState = (): MailState => ({ elements: state, mailSettings: {} }) as unknown as MailState;

    it('stops requesting a load once MAX_ELEMENT_LIST_LOAD_RETRIES same-payload failures are recorded', () => {
        const error = new Error('Test error');

        // 3 consecutive failures for the exact same query (e.g. repeatedly failing while offline)
        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error } });
        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error } });
        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error } });

        expect(state.retry.count).toBe(3);
        expect(shouldLoadElements(toMailState(), { page: 0 })).toBe(false);
        // The mailbox should still show a loading state rather than a false "no messages" empty state.
        expect(selectLoading(toMailState(), { page: 0 })).toBe(true);
    });

    it('lets the mailbox load again once connectivity is restored, resetting the exhausted retry count', () => {
        const error = new Error('Test error');

        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error } });
        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error } });
        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error } });

        expect(shouldLoadElements(toMailState(), { page: 0 })).toBe(false);

        // Coming back online dispatches `retry` with no error, clearing the exhausted count.
        retry(state, { type: 'elements/retry', payload: { queryParameters: undefined, error: undefined } });

        expect(state.retry.count).toBeLessThan(3);
        expect(shouldLoadElements(toMailState(), { page: 0 })).toBe(true);
    });
});
