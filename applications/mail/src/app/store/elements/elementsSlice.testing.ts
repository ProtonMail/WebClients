import type { MailStateSlice } from '../buildMailState.testing';
import { newElementsState } from './elementsInitialState';
import type { NewStateParams } from './elementsTypes';

/**
 * Builds the `elements` slice from the factory used by the application.
 * This ensure that changes in `ElementsState` breaks at compilation instead of silently passing.
 */
export const elementsState = (params?: NewStateParams): MailStateSlice => ({
    elements: newElementsState(params),
});
