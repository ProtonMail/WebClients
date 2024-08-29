import { all } from 'redux-saga/effects';

import type { PassSaga, RootSagaOptions } from '@proton/pass/store/types';

import aliasDetailsRequest from './alias/alias-details-request.saga';
import aliasOptionsRequest from './alias/alias-options-request.saga';
import aliasSyncEnable from './alias/alias-sync-enable.saga';
import aliasSyncPending from './alias/alias-sync-pending.saga';
import aliasToggleStatus from './alias/alias-toggle-status.saga';
import lockCreate from './auth/lock-create.saga';
import lock from './auth/lock.saga';
import passwordConfirm from './auth/password-confirm.saga';
import passwordExtra from './auth/password-extra.saga';
import unlock from './auth/unlock.saga';
import boot from './client/boot.saga';
import cache from './client/cache.saga';
import notification from './client/notification.saga';
import reportProblem from './client/report-problem.saga';
import settings from './client/settings.saga';
import sync from './client/sync.saga';
import events from './events/events.saga';
import itemsImport from './import/import.saga';
import inviteAccept from './invites/invite-accept.saga';
import inviteAddressesValidate from './invites/invite-addresses-validate.saga';
import inviteCreate from './invites/invite-create.saga';
import inviteRecommendations from './invites/invite-recommendations.saga';
import inviteReject from './invites/invite-reject.saga';
import inviteRemove from './invites/invite-remove.saga';
import inviteResend from './invites/invite-resend.saga';
import newUserInvitePromote from './invites/new-user-invite-promote.saga';
import newUserInviteRemove from './invites/new-user-invite-remove.saga';
import itemBulkDelete from './items/item-bulk-delete.saga';
import itemBulkMove from './items/item-bulk-move.saga';
import itemBulkRestore from './items/item-bulk-restore.saga';
import itemBulkTrash from './items/item-bulk-trash.saga';
import itemCreation from './items/item-creation.saga';
import itemDelete from './items/item-delete.saga';
import itemEdit from './items/item-edit.saga';
import itemHistory from './items/item-history.saga';
import itemMove from './items/item-move.saga';
import itemPin from './items/item-pin.saga';
import itemRestore from './items/item-restore.saga';
import itemTrash from './items/item-trash.saga';
import itemUnpin from './items/item-unpin.saga';
import itemSetFlags from './items/item.set-flags.saga';
import getOrganizationSettings from './organization/organization-settings.saga';
import secureLinkSagas from './secure-links/secure-links.sagas';
import shareAccessOptions from './shares/share-access-options.saga';
import shareEditRole from './shares/share-edit-role.saga';
import shareLeave from './shares/share-leave.saga';
import shareRemoveMember from './shares/share-remove-member.saga';
import featureFlags from './user/feature-flags.saga';
import userAccess from './user/user-access.saga';
import userSettings from './user/user-settings.saga';
import trashDelete from './vaults/trash-empty.saga';
import trashRestore from './vaults/trash-restore.saga';
import vaultCreation from './vaults/vault-creation.saga';
import vaultDelete from './vaults/vault-delete.saga';
import vaultEdit from './vaults/vault-edit.saga';
import vaultMoveAllItems from './vaults/vault-move-all-items.saga';
import vaultTransferOwner from './vaults/vault-transfer-owner.saga';

const COMMON_SAGAS = [
    ...secureLinkSagas,
    aliasDetailsRequest,
    aliasOptionsRequest,
    aliasSyncEnable,
    aliasSyncPending,
    aliasToggleStatus,
    boot,
    cache,
    events,
    featureFlags,
    getOrganizationSettings,
    inviteAccept,
    inviteAddressesValidate,
    inviteCreate,
    inviteRecommendations,
    inviteReject,
    inviteRemove,
    inviteResend,
    itemBulkDelete,
    itemBulkMove,
    itemBulkRestore,
    itemBulkTrash,
    itemCreation,
    itemDelete,
    itemEdit,
    itemHistory,
    itemMove,
    itemPin,
    itemRestore,
    itemSetFlags,
    itemsImport,
    itemTrash,
    itemUnpin,
    lock,
    lockCreate,
    newUserInvitePromote,
    newUserInviteRemove,
    notification,
    passwordConfirm,
    passwordExtra,
    reportProblem,
    settings,
    shareAccessOptions,
    shareEditRole,
    shareLeave,
    shareRemoveMember,
    sync,
    trashDelete,
    trashRestore,
    unlock,
    userAccess,
    userSettings,
    vaultCreation,
    vaultDelete,
    vaultEdit,
    vaultMoveAllItems,
    vaultTransferOwner,
];

export const rootSagaFactory = (platformSagas: PassSaga[]) =>
    function* workerRootSaga(options: RootSagaOptions) {
        yield all(COMMON_SAGAS.concat(platformSagas).map((saga) => saga(options)));
    };
