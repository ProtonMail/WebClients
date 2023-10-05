import { all } from 'redux-saga/effects';

import type { WorkerRootSagaOptions } from '../types';
import aliasDetailsRequest from './alias-details-request.saga';
import aliasOptionsRequest from './alias-options-request.saga';
import boot from './boot.saga';
import cache from './cache.saga';
import events from './events.saga';
import featureFlags from './feature-flags.saga';
import itemsImport from './import.saga';
import inviteAccept from './invite-accept.saga';
import inviteCreate from './invite-create.saga';
import inviteReject from './invite-reject.saga';
import inviteRemove from './invite-remove.saga';
import inviteResend from './invite-resend.saga';
import itemCreation from './item-creation.saga';
import itemDelete from './item-delete.saga';
import itemEdit from './item-edit.saga';
import itemMove from './item-move.saga';
import itemRestore from './item-restore.saga';
import itemTrash from './item-trash.saga';
import itemUsed from './item-used.saga';
import itemsRequest from './items-request.saga';
import notification from './notification.saga';
import reportProblem from './report-problem.saga';
import request from './request-saga';
import sessionLockDisable from './session-lock-disable.saga';
import sessionLockEnable from './session-lock-enable.saga';
import sessionLockImmediate from './session-lock-immediate.saga';
import sessionUnlock from './session-unlock.saga';
import settings from './settings.saga';
import shareAccessOptions from './share-access-options.saga';
import shareEditRole from './share-edit-role.saga';
import shareLeave from './share-leave.saga';
import shareRemoveMember from './share-remove-member.saga';
import signout from './signout.saga';
import sync from './sync.saga';
import trashDelete from './trash-delete.saga';
import trashRestore from './trash-restore.saga';
import userPlan from './user-plan';
import vaultCreation from './vault-creation.saga';
import vaultDelete from './vault-delete.saga';
import vaultEdit from './vault-edit.saga';
import vaultSetPrimary from './vault-set-primary.saga';
import vaultTransferOwner from './vault-transfer-owner.saga';
import wakeup from './wakeup.saga';

export function* workerRootSaga(options: WorkerRootSagaOptions) {
    yield all(
        [
            aliasOptionsRequest,
            aliasDetailsRequest,
            boot,
            cache,
            events,
            featureFlags,
            inviteAccept,
            inviteCreate,
            inviteReject,
            inviteResend,
            inviteRemove,
            itemsRequest,
            itemCreation,
            itemEdit,
            itemMove,
            itemTrash,
            itemDelete,
            itemRestore,
            itemsImport,
            trashDelete,
            trashRestore,
            itemUsed,
            notification,
            reportProblem,
            request,
            shareAccessOptions,
            shareEditRole,
            shareLeave,
            shareRemoveMember,
            sessionLockDisable,
            sessionLockEnable,
            sessionLockImmediate,
            sessionUnlock,
            settings,
            signout,
            sync,
            userPlan,
            vaultCreation,
            vaultEdit,
            vaultDelete,
            vaultSetPrimary,
            vaultTransferOwner,
            wakeup,
        ].map((saga) => saga(options))
    );
}
