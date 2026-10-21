import { all, put, select } from 'redux-saga/effects';

import { draftDiscard } from '../../../store/actions/creators/item';
import type { Draft } from '../../../store/reducers/drafts';
import { selectItemDrafts } from '../../../store/selectors/items';
import { matchDraftsForShare } from '../../items/item.utils';

export function* discardDrafts(shareId: string, itemIds?: string[]) {
    try {
        const drafts: Draft[] = yield select(selectItemDrafts);
        const deleteDrafts = matchDraftsForShare(drafts, shareId, itemIds);
        yield all(deleteDrafts.map((draft) => put(draftDiscard(draft))));
    } catch {}
}
