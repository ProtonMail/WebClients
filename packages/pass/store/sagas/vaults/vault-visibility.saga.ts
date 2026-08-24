import { select } from 'redux-saga/effects';

import { toMap } from '@proton/shared/lib/helpers/object';

import { toggleVisibility } from '../../../lib/shares/share.requests';
import type { Share, ShareType } from '../../../types';
import { sharesVisibilityEdit } from '../../actions';
import type { SharesState } from '../../reducers';
import { createRequestSaga } from '../../request/sagas';
import { selectShareState } from '../../selectors';

export default [
    createRequestSaga({
        actions: sharesVisibilityEdit,
        call: function* ({ sharesToHide, sharesToUnhide }) {
            const state: SharesState = yield select(selectShareState);
            const shares: Share<ShareType.Vault>[] = yield toggleVisibility(sharesToHide, sharesToUnhide, state);
            return toMap(shares, 'shareId');
        },
    }),
] as const;
