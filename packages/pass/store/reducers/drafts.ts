/** combined in main items reducer: `./items.ts` */
import type { Reducer } from 'redux';

import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { draftDiscard, draftSave, draftsGarbageCollect } from '@proton/pass/store/actions';
import type { ItemType } from '@proton/pass/types';

/** revision number is stored on the `EditDraft` type in order
 * to future-proof drafts v2 : this will allow detecting stale
 * draft entries if an item was updated while having a draft. */
export type DraftBase = { mode: 'new'; type: ItemType } | { mode: 'edit'; itemId: string; shareId: string; revision: number };

export type Draft<V extends {} = any> = DraftBase & { formData: V };
export type EditDraft = Extract<Draft, { mode: 'edit' }>;
export type NewDraft = Extract<Draft, { mode: 'new' }>;

/** Draft state now supports pushing multiple entries so as to future-proof
 * drafts v2. In the extension, we are stil relying on a single active draft
 * and all drafts will be garbage collected on extension boot. This behaviour
 * does not make sense for the web-app and is unavailable for web. */
export const draftsReducer: Reducer<Draft[]> = (state = [], action) => {
    /* Ensures only one new item draft exists and that we do not
     * have duplicates for item edit drafts */
    const sanitizeDrafts = (drafts: Draft[], draft: DraftBase) => {
        if (draft.mode === 'new') return drafts.filter(({ mode }) => mode !== 'new');
        else return drafts.filter((entry) => entry.mode === 'new' || !itemEq(draft)(entry));
    };

    if (draftSave.match(action)) return [action.payload, ...sanitizeDrafts(state, action.payload)];
    if (draftDiscard.match(action)) return sanitizeDrafts(state, action.payload);
    if (draftsGarbageCollect.match(action)) return [];

    return state;
};
