import { all } from 'redux-saga/effects';

import aliasDetailsRequest from '@proton/pass/store/sagas/alias/alias-details-request.saga';
import aliasOptionsRequest from '@proton/pass/store/sagas/alias/alias-options-request.saga';
import sessionLockDisable from '@proton/pass/store/sagas/auth/session-lock-disable.saga';
import sessionLockEnable from '@proton/pass/store/sagas/auth/session-lock-enable.saga';
import sessionLockImmediate from '@proton/pass/store/sagas/auth/session-lock-immediate.saga';
import sessionUnlock from '@proton/pass/store/sagas/auth/session-unlock.saga';
import boot from '@proton/pass/store/sagas/client/boot.saga';
import cache from '@proton/pass/store/sagas/client/cache.saga';
import notification from '@proton/pass/store/sagas/client/notification.saga';
import reportProblem from '@proton/pass/store/sagas/client/report-problem.saga';
import request from '@proton/pass/store/sagas/client/request-saga';
import settings from '@proton/pass/store/sagas/client/settings.saga';
import sync from '@proton/pass/store/sagas/client/sync.saga';
import events from '@proton/pass/store/sagas/events/events.saga';
import itemsImport from '@proton/pass/store/sagas/import/import.saga';
import inviteAccept from '@proton/pass/store/sagas/invites/invite-accept.saga';
import inviteCreate from '@proton/pass/store/sagas/invites/invite-create.saga';
import inviteReject from '@proton/pass/store/sagas/invites/invite-reject.saga';
import inviteRemove from '@proton/pass/store/sagas/invites/invite-remove.saga';
import inviteResend from '@proton/pass/store/sagas/invites/invite-resend.saga';
import newUserInvitePromote from '@proton/pass/store/sagas/invites/new-user-invite-promote.saga';
import newUserInviteRemove from '@proton/pass/store/sagas/invites/new-user-invite-remove.saga';
import itemCreation from '@proton/pass/store/sagas/items/item-creation.saga';
import itemDelete from '@proton/pass/store/sagas/items/item-delete.saga';
import itemEdit from '@proton/pass/store/sagas/items/item-edit.saga';
import itemMove from '@proton/pass/store/sagas/items/item-move.saga';
import itemRestore from '@proton/pass/store/sagas/items/item-restore.saga';
import itemTrash from '@proton/pass/store/sagas/items/item-trash.saga';
import itemUsed from '@proton/pass/store/sagas/items/item-used.saga';
import shareAccessOptions from '@proton/pass/store/sagas/shares/share-access-options.saga';
import shareEditRole from '@proton/pass/store/sagas/shares/share-edit-role.saga';
import shareLeave from '@proton/pass/store/sagas/shares/share-leave.saga';
import shareRemoveMember from '@proton/pass/store/sagas/shares/share-remove-member.saga';
import featureFlags from '@proton/pass/store/sagas/user/feature-flags.saga';
import userPlan from '@proton/pass/store/sagas/user/user-access.saga';
import trashDelete from '@proton/pass/store/sagas/vaults/trash-empty.saga';
import trashRestore from '@proton/pass/store/sagas/vaults/trash-restore.saga';
import vaultCreation from '@proton/pass/store/sagas/vaults/vault-creation.saga';
import vaultDelete from '@proton/pass/store/sagas/vaults/vault-delete.saga';
import vaultEdit from '@proton/pass/store/sagas/vaults/vault-edit.saga';
import vaultMoveAllItems from '@proton/pass/store/sagas/vaults/vault-move-all-items.saga';
import vaultTransferOwner from '@proton/pass/store/sagas/vaults/vault-transfer-owner.saga';
import { type WorkerRootSagaOptions } from '@proton/pass/store/types';

export function* rootSaga(options: WorkerRootSagaOptions) {
    yield all(
        [
            aliasDetailsRequest,
            aliasOptionsRequest,
            boot,
            cache,
            events,
            featureFlags,
            inviteAccept,
            inviteCreate,
            inviteReject,
            inviteRemove,
            inviteResend,
            itemCreation,
            itemDelete,
            itemEdit,
            itemMove,
            itemRestore,
            itemsImport,
            itemTrash,
            itemUsed,
            newUserInvitePromote,
            newUserInviteRemove,
            notification,
            reportProblem,
            request,
            sessionLockDisable,
            sessionLockEnable,
            sessionLockImmediate,
            sessionUnlock,
            settings,
            shareAccessOptions,
            shareEditRole,
            shareLeave,
            shareRemoveMember,
            sync,
            trashDelete,
            trashRestore,
            userPlan,
            vaultCreation,
            vaultDelete,
            vaultEdit,
            vaultMoveAllItems,
            vaultTransferOwner,
        ].map((saga) => saga(options))
    );
}
