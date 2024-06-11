import { all } from 'redux-saga/effects';

import aliasDetailsRequest from '@proton/pass/store/sagas/alias/alias-details-request.saga';
import aliasOptionsRequest from '@proton/pass/store/sagas/alias/alias-options-request.saga';
import lockCreate from '@proton/pass/store/sagas/auth/lock-create.saga';
import lock from '@proton/pass/store/sagas/auth/lock.saga';
import unlock from '@proton/pass/store/sagas/auth/unlock.saga';
import boot from '@proton/pass/store/sagas/client/boot.saga';
import cache from '@proton/pass/store/sagas/client/cache.saga';
import notification from '@proton/pass/store/sagas/client/notification.saga';
import offlineDisable from '@proton/pass/store/sagas/client/offline-disable.saga';
import offlineEnable from '@proton/pass/store/sagas/client/offline-enable.saga';
import offlineResume from '@proton/pass/store/sagas/client/offline-resume.saga';
import reportProblem from '@proton/pass/store/sagas/client/report-problem.saga';
import settings from '@proton/pass/store/sagas/client/settings.saga';
import sync from '@proton/pass/store/sagas/client/sync.saga';
import events from '@proton/pass/store/sagas/events/events.saga';
import itemsImport from '@proton/pass/store/sagas/import/import.saga';
import inviteAccept from '@proton/pass/store/sagas/invites/invite-accept.saga';
import inviteAddressesValidate from '@proton/pass/store/sagas/invites/invite-addresses-validate.saga';
import inviteCreate from '@proton/pass/store/sagas/invites/invite-create.saga';
import inviteRecommendations from '@proton/pass/store/sagas/invites/invite-recommendations.saga';
import inviteReject from '@proton/pass/store/sagas/invites/invite-reject.saga';
import inviteRemove from '@proton/pass/store/sagas/invites/invite-remove.saga';
import inviteResend from '@proton/pass/store/sagas/invites/invite-resend.saga';
import newUserInvitePromote from '@proton/pass/store/sagas/invites/new-user-invite-promote.saga';
import newUserInviteRemove from '@proton/pass/store/sagas/invites/new-user-invite-remove.saga';
import itemBulkDelete from '@proton/pass/store/sagas/items/item-bulk-delete.saga';
import itemBulkMove from '@proton/pass/store/sagas/items/item-bulk-move.saga';
import itemBulkRestore from '@proton/pass/store/sagas/items/item-bulk-restore.saga';
import itemBulkTrash from '@proton/pass/store/sagas/items/item-bulk-trash.saga';
import itemCreation from '@proton/pass/store/sagas/items/item-creation.saga';
import itemDelete from '@proton/pass/store/sagas/items/item-delete.saga';
import itemEdit from '@proton/pass/store/sagas/items/item-edit.saga';
import itemHistory from '@proton/pass/store/sagas/items/item-history.saga';
import itemMove from '@proton/pass/store/sagas/items/item-move.saga';
import itemPin from '@proton/pass/store/sagas/items/item-pin.saga';
import itemRestore from '@proton/pass/store/sagas/items/item-restore.saga';
import itemTrash from '@proton/pass/store/sagas/items/item-trash.saga';
import itemUnpin from '@proton/pass/store/sagas/items/item-unpin.saga';
import itemSetFlags from '@proton/pass/store/sagas/items/item.set-flags.saga';
import breachesAlias from '@proton/pass/store/sagas/monitor/breaches.alias.saga';
import breachesCustom from '@proton/pass/store/sagas/monitor/breaches.custom.saga';
import breachesProton from '@proton/pass/store/sagas/monitor/breaches.proton.saga';
import breaches from '@proton/pass/store/sagas/monitor/breaches.saga';
import customAddressAdd from '@proton/pass/store/sagas/monitor/custom-address.add.saga';
import customAddressDelete from '@proton/pass/store/sagas/monitor/custom-address.delete';
import customAddressResend from '@proton/pass/store/sagas/monitor/custom-address.resend';
import customAddressVerify from '@proton/pass/store/sagas/monitor/custom-address.verify';
import monitorAddressResolve from '@proton/pass/store/sagas/monitor/monitor-address.resolve.saga';
import monitorAddressToggle from '@proton/pass/store/sagas/monitor/monitor-address.toggle.saga';
import monitorToggle from '@proton/pass/store/sagas/monitor/monitor-toggle.saga';
import sentinelToggle from '@proton/pass/store/sagas/monitor/sentinel-toggle.saga';
import organizationSettingsGet from '@proton/pass/store/sagas/organization/organization-settings.saga';
import shareAccessOptions from '@proton/pass/store/sagas/shares/share-access-options.saga';
import shareEditRole from '@proton/pass/store/sagas/shares/share-edit-role.saga';
import shareLeave from '@proton/pass/store/sagas/shares/share-leave.saga';
import shareRemoveMember from '@proton/pass/store/sagas/shares/share-remove-member.saga';
import featureFlags from '@proton/pass/store/sagas/user/feature-flags.saga';
import userAccess from '@proton/pass/store/sagas/user/user-access.saga';
import userSettings from '@proton/pass/store/sagas/user/user-settings.saga';
import trashDelete from '@proton/pass/store/sagas/vaults/trash-empty.saga';
import trashRestore from '@proton/pass/store/sagas/vaults/trash-restore.saga';
import vaultCreation from '@proton/pass/store/sagas/vaults/vault-creation.saga';
import vaultDelete from '@proton/pass/store/sagas/vaults/vault-delete.saga';
import vaultEdit from '@proton/pass/store/sagas/vaults/vault-edit.saga';
import vaultMoveAllItems from '@proton/pass/store/sagas/vaults/vault-move-all-items.saga';
import vaultTransferOwner from '@proton/pass/store/sagas/vaults/vault-transfer-owner.saga';
import { type RootSagaOptions } from '@proton/pass/store/types';

export function* rootSaga(options: RootSagaOptions) {
    yield all(
        [
            aliasDetailsRequest,
            aliasOptionsRequest,
            boot,
            breaches,
            breachesAlias,
            breachesCustom,
            breachesProton,
            cache,
            customAddressAdd,
            customAddressDelete,
            customAddressResend,
            customAddressVerify,
            events,
            featureFlags,
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
            monitorAddressResolve,
            monitorAddressToggle,
            monitorToggle,
            newUserInvitePromote,
            newUserInviteRemove,
            notification,
            offlineDisable,
            offlineEnable,
            offlineResume,
            organizationSettingsGet,
            reportProblem,
            sentinelToggle,
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
        ].map((saga) => saga(options))
    );
}
