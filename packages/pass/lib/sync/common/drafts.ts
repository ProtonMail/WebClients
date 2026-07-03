import { all, put, select } from 'redux-saga/effects';

import { matchDraftsForShare } from '@proton/pass/lib/items/item.utils';
import { draftDiscard } from '@proton/pass/store/actions';
import type { Draft } from '@proton/pass/store/reducers/drafts';
import { selectItemDrafts } from '@proton/pass/store/selectors';

export function* discardDrafts(shareId: string, itemIds?: string[]) {
    try {
        const drafts: Draft[] = yield select(selectItemDrafts);
        const deleteDrafts = matchDraftsForShare(drafts, shareId, itemIds);
        yield all(deleteDrafts.map((draft) => put(draftDiscard(draft))));
    } catch {}
}
