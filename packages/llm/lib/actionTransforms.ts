import { type TransformCallback, makeRefineCleanup } from './formatPrompt';
import { makeTransformWriteFullEmail } from './helpers';
import type { Action } from './types';

export function getTransformForAction(action: Action): TransformCallback {
    switch (action.type) {
        case 'writeFullEmail':
            return makeTransformWriteFullEmail(action.sender);
        default:
            return makeRefineCleanup(action);
    }
}
