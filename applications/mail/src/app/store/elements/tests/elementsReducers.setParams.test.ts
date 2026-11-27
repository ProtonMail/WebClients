import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getContextIdentifierFromParams } from '../../../helpers/elements';
import { newElementsState } from '../elementsInitialState';
import { setParams } from '../elementsReducers';
import type { ElementsState, ElementsStateParams } from '../elementsTypes';

const action = (
    payload: Partial<ElementsStateParams> & { total?: number }
): PayloadAction<Partial<ElementsStateParams> & { total?: number }> => ({ type: 'elements/setParams', payload });

describe('setParams — bypassed elements in the previous context total', () => {
    let state: Draft<ElementsState>;
    let contextFilter: string;

    beforeEach(() => {
        state = newElementsState({ params: { filter: { Unread: 1 } } }) as Draft<ElementsState>;
        contextFilter = getContextIdentifierFromParams(state.params);
        state.total[contextFilter] = 10;
        state.bypassFilter = ['bypassed'];
    });

    it('leaves the total alone when partial params keep the same context', () => {
        setParams(state, action({ conversationMode: state.params.conversationMode }));

        expect(state.total[contextFilter]).toBe(10);
    });

    it('removes bypassed elements from the total of the context being left', () => {
        setParams(state, action({ labelID: MAILBOX_LABEL_IDS.ARCHIVE }));

        expect(state.total[contextFilter]).toBe(9);
    });
});
