import { toggleVisibility } from '@proton/pass/lib/shares/share.requests';
import { sharesVisibilityEdit } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { Share, ShareId, ShareType } from '@proton/pass/types';

export default createRequestSaga({
    actions: sharesVisibilityEdit,
    call: function* ({ visibilityMap }) {
        const shareIds = Object.keys(visibilityMap);
        const shares: Record<ShareId, Share<ShareType.Vault>> = {};
        const failures: string[] = [];

        for (const shareId of shareIds) {
            try {
                shares[shareId] = yield toggleVisibility(shareId, visibilityMap[shareId]);
            } catch {
                failures.push(shareId);
            }
        }

        /** Definite error if no shareIds could be toggled */
        if (failures.length === shareIds.length) throw new Error();

        return { shares };
    },
});
