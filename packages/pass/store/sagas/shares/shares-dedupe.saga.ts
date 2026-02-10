import type { Share as ShareCore, TargetType } from '@protontech/pass-rust-core/worker';
import { put, select, takeLatest } from 'redux-saga/effects';

import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import { sharesDedupeUpdate } from '@proton/pass/store/actions';
import { isShareDedupeAction } from '@proton/pass/store/actions/enhancers/dedupe';
import { selectAllShares } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ShareId } from '@proton/pass/types';
import { type Share, ShareType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const convertType = (type: ShareType): TargetType => {
    switch (type) {
        case ShareType.Vault:
            return 'Vault';
        case ShareType.Item:
            return 'Item';
    }
};

const convertShare = (share: Share): ShareCore => {
    return {
        share_id: share.shareId,
        vault_id: share.vaultId,
        target_type: convertType(share.targetType),
        target_id: share.targetId,
        role: share.shareRoleId,
        permissions: share.permission,
        flags: share.flags,
    };
};

function* dedupeWorker({ getCore }: RootSagaOptions) {
    const shares: Share[] = yield select(selectAllShares);
    const sharesCore: ShareCore[] = shares.map(convertShare);

    try {
        const [dedupe, dedupeAndVisible]: [ShareId[], ShareId[]] = yield Promise.all([
            getCore().get_visible_shares(sharesCore, false),
            getCore().get_visible_shares(sharesCore, true),
        ]);
        yield put(sharesDedupeUpdate({ dedupe, dedupeAndVisible }));
    } catch (error) {
        /** There seems to be non clearly identified race conditions
         * (rare, maybe on related to dev tools) that leads to errors during
         * rust dedupe computation, probably rust worker not started yet.
         * No dedupe in the state is problematic because no data will
         * be shown at all. So, better to have a fallback to ensure dedupe
         * ids are not empty */
        logger.debug('[Dedupe] Dedupe failed', error);

        try {
            const [dedupe, dedupeAndVisible]: [ShareId[], ShareId[]] = [[], []];
            sharesCore.forEach((share) => {
                dedupe.push(share.share_id);
                if (isShareVisible(share)) dedupeAndVisible.push(share.share_id);
            });
            yield put(sharesDedupeUpdate({ dedupe, dedupeAndVisible }));
        } catch (error) {
            logger.warn('[Dedupe] Fallback dedupe failed', error);
        }
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(isShareDedupeAction, dedupeWorker, options);
}
