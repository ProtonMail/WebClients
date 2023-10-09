/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/events/constants';
import type { InvitesGetResponse, MaybeNull } from '@proton/pass/types';
import { type Api } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { Invite } from '@proton/pass/types/data/invites';
import { truthy } from '@proton/pass/utils/fp';
import { logId, logger } from '@proton/pass/utils/logger';
import { decodeVaultContent } from '@proton/pass/utils/protobuf';
import { toMap } from '@proton/shared/lib/helpers/object';

import { type EventManagerEvent, NOOP_EVENT } from '../../../events/manager';
import { syncInvites } from '../../actions';
import type { InviteState } from '../../reducers/invites';
import { selectUserFeature } from '../../selectors';
import { selectInvites } from '../../selectors/invites';
import type { WorkerRootSagaOptions } from '../../types';
import { getPublicKeysForEmail } from '../workers/address';
import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';

const NAMESPACE = 'Saga::InvitesChannel';

function* onInvitesEvent(event: EventManagerEvent<InvitesGetResponse>) {
    if ('error' in event) throw event.error;

    const cachedInvites: InviteState = yield select(selectInvites);

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
                    inviteKey: inviteKey,
                    inviterPublicKeys: await getPublicKeysForEmail(invite.InviterEmail),
                    encryptedVaultContent: encryptedVault.Content,
                });

                return {
                    token: invite.InviteToken,
                    targetId: invite.TargetID,
                    targetType: invite.TargetType,
                    remindersSent: invite.RemindersSent,
                    invitedEmail: invite.InvitedEmail,
                    inviterEmail: invite.InviterEmail,
                    createTime: invite.CreateTime,
                    keys: invite.Keys,
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

export function* invitesChannel(api: Api, options: WorkerRootSagaOptions) {
    const allowSharing: boolean = yield select(selectUserFeature(PassFeature.PassSharingV1));
    if (!allowSharing) return;

    logger.info(`[${NAMESPACE}] start polling for invites`);

    const eventsChannel = createInvitesChannel(api);
    const events = fork(channelEventsWorker<InvitesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<InvitesGetResponse>, eventsChannel);

    yield all([events, wakeup]);
}
