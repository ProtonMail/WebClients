import { select, takeEvery } from 'redux-saga/effects';

import { toggleVisibility } from '@proton/pass/lib/shares/share.requests';
import { sharesVisibilityEdit } from '@proton/pass/store/actions';
import type { SharesState } from '@proton/pass/store/reducers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectShareState } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Share, ShareType } from '@proton/pass/types';
import { toMap } from '@proton/shared/lib/helpers/object';

export default [
    createRequestSaga({
        actions: sharesVisibilityEdit,
        call: function* ({ sharesToHide, sharesToUnhide }) {
            const state: SharesState = yield select(selectShareState);
            const shares: Share<ShareType.Vault>[] = yield toggleVisibility(sharesToHide, sharesToUnhide, state);
            return toMap(shares, 'shareId');
        },
    }),
    function* (options: RootSagaOptions) {
        yield takeEvery(sharesVisibilityEdit.success.match, () => options.onItemsUpdated?.());
    },
] as const;
