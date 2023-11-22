import { all } from 'redux-saga/effects';

import type { WorkerRootSagaOptions } from '../types';
import aliasDetailsRequest from './alias/alias-details-request.saga';
import aliasOptionsRequest from './alias/alias-options-request.saga';
import sessionLockDisable from './auth/session-lock-disable.saga';
import sessionLockEnable from './auth/session-lock-enable.saga';
import sessionLockImmediate from './auth/session-lock-immediate.saga';
import sessionUnlock from './auth/session-unlock.saga';
import signout from './auth/signout.saga';
import boot from './client/boot.saga';
import cache from './client/cache.saga';
import notification from './client/notification.saga';
import reportProblem from './client/report-problem.saga';
import request from './client/request-saga';
import settings from './client/settings.saga';
import sync from './client/sync.saga';
import wakeup from './client/wakeup.saga';
import events from './events/events.saga';
import itemsImport from './import/import.saga';
import inviteAccept from './invites/invite-accept.saga';
import inviteCreate from './invites/invite-create.saga';
import inviteReject from './invites/invite-reject.saga';
import inviteRemove from './invites/invite-remove.saga';
import inviteResend from './invites/invite-resend.saga';
import newUserInvitePromote from './invites/new-user-invite-promote.saga';
import newUserInviteRemove from './invites/new-user-invite-remove.saga';
import itemAutofilled from './items/item-autofill.saga';
import itemCreation from './items/item-creation.saga';
import itemDelete from './items/item-delete.saga';
import itemEdit from './items/item-edit.saga';
import itemMove from './items/item-move.saga';
import itemRestore from './items/item-restore.saga';
import itemTrash from './items/item-trash.saga';
import shareAccessOptions from './shares/share-access-options.saga';
import shareEditRole from './shares/share-edit-role.saga';
import shareLeave from './shares/share-leave.saga';
import shareRemoveMember from './shares/share-remove-member.saga';
import featureFlags from './user/feature-flags.saga';
import userPlan from './user/user-access.saga';
import trashDelete from './vaults/trash-empty.saga';
import trashRestore from './vaults/trash-restore.saga';
import vaultCreation from './vaults/vault-creation.saga';
import vaultDelete from './vaults/vault-delete.saga';
import vaultEdit from './vaults/vault-edit.saga';
import vaultMoveAllItems from './vaults/vault-move-all-items.saga';
import vaultTransferOwner from './vaults/vault-transfer-owner.saga';

export function* workerRootSaga(options: WorkerRootSagaOptions) {
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
            itemAutofilled,
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
            signout,
            sync,
            trashDelete,
            trashRestore,
            userPlan,
            vaultCreation,
            vaultDelete,
            vaultEdit,
            vaultMoveAllItems,
            vaultTransferOwner,
            wakeup,
        ].map((saga) => saga(options))
    );
}
