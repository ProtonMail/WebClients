import { editHide } from '@proton/pass/lib/shares/share.requests';
import { sharesHide } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { Share, ShareId, ShareType } from '@proton/pass/types';

export default createRequestSaga({
    actions: sharesHide,
    call: function* (payload) {
        const shares: Record<ShareId, Share<ShareType.Vault>> = {};
        const errors: unknown[] = [];

        // Using a for to send request one after the other not to overload the API
        for (const [shareId, hide] of Object.entries(payload.hideMap)) {
            try {
                shares[shareId] = yield editHide(shareId, hide);
            } catch (error) {
                // Going through the list even if errors
                errors.push(error);
            }
        }

        if (errors.length > 0) throw errors[0];
        return { shares };
    },
});
