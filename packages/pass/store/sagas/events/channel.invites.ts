/* eslint-disable curly */
import { all, fork, put, select } from 'redux-saga/effects';

import { getPublicKeysForEmail } from '@proton/pass/lib/auth/address';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { type EventManagerEvent, NOOP_EVENT } from '@proton/pass/lib/events/manager';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import { syncInvites } from '@proton/pass/store/actions';
import type { InviteState } from '@proton/pass/store/reducers';
import { selectAllVaults } from '@proton/pass/store/selectors';
import { selectInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { InvitesGetResponse, MaybeNull, Share } from '@proton/pass/types';
import { type Api, ShareType } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { toMap } from '@proton/shared/lib/helpers/object';

import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';

const NAMESPACE = 'ServerEvents::Invites';

function* onInvitesEvent(event: EventManagerEvent<InvitesGetResponse>) {
    if ('error' in event) throw event.error;

    const cachedInvites: InviteState = yield select(selectInvites);
    const cachedInviteTokens = Object.keys(cachedInvites);

    const noop =
        event.Invites.length === cachedInviteTokens.length &&
        event.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

    if (noop) return;

    logger.info(`[ServerEvents::Invites] ${event.Invites.length} new invite(s) received`);

    const vaults = (yield select(selectAllVaults)) as Share<ShareType.Vault>[];
    const vaultIds = vaults.map(prop('vaultId'));

    const invites: MaybeNull<Invite>[] = yield Promise.all(
        event.Invites.map<Promise<MaybeNull<Invite>>>(async (invite) => {
            /* Filter out invites that were just accepted. This is necessary
             * because there might be a slight delay between invite acceptance
             * and database replication, potentially causing accepted invites
             * to still appear in the results. */
            if (vaultIds.includes(invite.TargetID)) return null;

            /* if invite already decrypted early return */
            const cachedInvite = cachedInvites[invite.InviteToken];
            if (cachedInvite) return cachedInvite;

            const encryptedVault = invite.VaultData;
            if (!encryptedVault && invite.TargetType !== ShareType.Item) return null;

            const inviteKey =
                invite.TargetType === ShareType.Item
                    ? invite.Keys[0]
                    : invite.Keys.find((key) => key.KeyRotation === encryptedVault!.ContentKeyRotation);
            if (!inviteKey) return null;

            try {
                const encodedVault =
                    invite.TargetType === ShareType.Vault
                        ? await PassCrypto.readVaultInvite({
                              encryptedVaultContent: encryptedVault!.Content,
                              invitedAddressId: invite.InvitedAddressID!,
                              inviteKey: inviteKey,
                              inviterPublicKeys: await getPublicKeysForEmail(invite.InviterEmail),
                          })
                        : null;

                return {
                    createTime: invite.CreateTime,
                    invitedAddressId: invite.InvitedAddressID!,
                    invitedEmail: invite.InvitedEmail,
                    inviterEmail: invite.InviterEmail,
                    fromNewUser: invite.FromNewUser,
                    keys: invite.Keys,
                    remindersSent: invite.RemindersSent,
                    targetId: invite.TargetID,
                    targetType: invite.TargetType,
                    token: invite.InviteToken,
                    vault: encodedVault
                        ? {
                              content: decodeVaultContent(encodedVault),
                              memberCount: encryptedVault!.MemberCount,
                              itemCount: encryptedVault!.ItemCount,
                          }
                        : null,
                };
            } catch (err: unknown) {
                logger.warn(`[${NAMESPACE}] Could not decrypt invite`, err);
                return null;
            }
        })
    );

    yield put(syncInvites(toMap(invites.filter(truthy), 'token')));
}

export const createInvitesChannel = (api: Api) =>
    eventChannelFactory<InvitesGetResponse>({
        api,
        channelId: 'invites',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: () => ({ url: `pass/v1/invite`, method: 'get' }),
        onEvent: onInvitesEvent,
        onClose: () => logger.info(`[${NAMESPACE}] closing channel`),
    });

export function* invitesChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[${NAMESPACE}] start polling`);

    const eventsChannel = createInvitesChannel(api);
    const events = fork(channelEvents<InvitesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelInitalize<InvitesGetResponse>, eventsChannel, options);

    yield all([events, wakeup]);
}
