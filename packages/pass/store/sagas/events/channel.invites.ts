/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select } from 'redux-saga/effects';

import { getPublicKeysForEmail } from '@proton/pass/lib/auth/address';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { type EventManagerEvent, NOOP_EVENT } from '@proton/pass/lib/events/manager';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import { syncInvites } from '@proton/pass/store/actions';
import type { InviteState } from '@proton/pass/store/reducers';
import { selectFeatureFlag } from '@proton/pass/store/selectors';
import { selectInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { InvitesGetResponse, MaybeNull } from '@proton/pass/types';
import { type Api } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { Invite } from '@proton/pass/types/data/invites';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
import { toMap } from '@proton/shared/lib/helpers/object';

import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';

const NAMESPACE = 'Saga::InvitesChannel';

function* onInvitesEvent(event: EventManagerEvent<InvitesGetResponse>) {
    if ('error' in event) throw event.error;

    const cachedInvites: InviteState = yield select(selectInvites);
    const cachedInviteTokens = Object.keys(cachedInvites);

    const noop =
        event.Invites.length === cachedInviteTokens.length &&
        event.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

    if (noop) return;

    const invites: MaybeNull<Invite>[] = yield Promise.all(
        event.Invites.map<Promise<MaybeNull<Invite>>>(async (invite) => {
            /* if invite already decrypted early return */
            const cachedInvite = cachedInvites[invite.InviteToken];
            if (cachedInvite) return cachedInvite;

            /* FIXME: support item invites */
            const encryptedVault = invite.VaultData;
            if (!encryptedVault) return null;

            const inviteKey = invite.Keys.find((key) => key.KeyRotation === encryptedVault.ContentKeyRotation);
            if (!inviteKey) return null;

            try {
                const encodedVault = await PassCrypto.readVaultInvite({
                    encryptedVaultContent: encryptedVault.Content,
                    invitedAddressId: invite.InvitedAddressID!,
                    inviteKey: inviteKey,
                    inviterPublicKeys: await getPublicKeysForEmail(invite.InviterEmail),
                });

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
                    vault: {
                        content: decodeVaultContent(encodedVault),
                        memberCount: encryptedVault.MemberCount!,
                        itemCount: encryptedVault.ItemCount!,
                    },
                };
            } catch (err) {
                logger.info(`[${NAMESPACE}] Could not decrypt invite "${logId(invite.InviteToken)}"`);
                return null;
            }
        })
    );

    yield put(syncInvites(toMap(invites.filter(truthy), 'token')));
}

export const createInvitesChannel = (api: Api) =>
    eventChannelFactory<InvitesGetResponse>({
        api,
        interval: ACTIVE_POLLING_TIMEOUT,
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: () => ({ url: `pass/v1/invite`, method: 'get' }),
        onEvent: onInvitesEvent,
        onClose: () => logger.info(`[${NAMESPACE}] closing channel`),
    });

export function* invitesChannel(api: Api, options: RootSagaOptions) {
    const sharingEnabled: boolean = yield select(selectFeatureFlag(PassFeature.PassSharingV1));
    if (!sharingEnabled) return;

    logger.info(`[${NAMESPACE}] start polling for invites`);

    const eventsChannel = createInvitesChannel(api);
    const events = fork(channelEventsWorker<InvitesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<InvitesGetResponse>, eventsChannel);

    yield all([events, wakeup]);
}
