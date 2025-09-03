import { toggleVisibility } from '@proton/pass/lib/shares/share.requests';
import { sharesVisibilityEdit } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { Share, ShareType } from '@proton/pass/types';
import { toMap } from '@proton/shared/lib/helpers/object';

export default createRequestSaga({
    actions: sharesVisibilityEdit,
    call: function* ({ sharesToHide, sharesToUnhide }) {
        const shares: Share<ShareType.Vault>[] = yield toggleVisibility(sharesToHide, sharesToUnhide);
        return toMap(shares, 'shareId');
    },
});
