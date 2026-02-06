import { all, fork, put, select } from 'redux-saga/effects';

import { type EventManagerEvent, NOOP_EVENT } from '@proton/pass/lib/events/manager';
import { parseGroupInviteVault } from '@proton/pass/lib/invites/invite.parser';
import { syncInvites } from '@proton/pass/store/actions';
import type { InviteState } from '@proton/pass/store/reducers';
import { selectInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, GroupInvitesListResponse, MaybeNull } from '@proton/pass/types';
import { InviteType, ShareType } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import { partition } from '@proton/pass/utils/array/partition';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { toMap } from '@proton/shared/lib/helpers/object';

import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';

const NAMESPACE = 'ServerEvents::GroupInvites';

type GroupInvitesGetResponse = { Invites: GroupInvitesListResponse };

function* onGroupInvitesEvent(event: EventManagerEvent<GroupInvitesGetResponse>) {
    if ('error' in event) throw event.error;

    const cachedInvites: InviteState = yield select(selectInvites);
    const cachedInviteTokens = Object.keys(cachedInvites);

    const noop =
        event.Invites.Invites.length === cachedInviteTokens.length &&
        event.Invites.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

    if (noop) return;

    logger.info(`[${NAMESPACE}] ${event.Invites.Invites.length} new invite(s) received`);

    const invites: MaybeNull<Invite>[] = yield Promise.all(
        event.Invites.Invites.map<Promise<MaybeNull<Invite>>>(async (invite) => {
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
                return {
                    type: invite.IsGroupOwner ? InviteType.GroupOwner : InviteType.GroupOrg,
                    createTime: invite.CreateTime,
                    invitedAddressId: invite.InvitedAddressID!,
                    invitedEmail: invite.InvitedEmail,
                    invitedGroupId: invite.InvitedGroupID,
                    inviterEmail: invite.InviterEmail,
                    fromNewUser: false,
                    keys: invite.Keys,
                    remindersSent: invite.RemindersSent,
                    targetId: invite.TargetID,
                    targetType: invite.TargetType,
                    token: invite.InviteToken,
                    vault: await parseGroupInviteVault(invite, inviteKey),
                };
            } catch (err: unknown) {
                logger.warn(`[${NAMESPACE}] Could not decrypt invite`, err);
                return null;
            }
        })
    );

    const [owners, orgs] = partition(invites.filter(truthy), (invite) => invite?.type === InviteType.GroupOwner);
    yield put(syncInvites({ type: InviteType.GroupOwner, invites: toMap(owners, 'token') }));
    yield put(syncInvites({ type: InviteType.GroupOrg, invites: toMap(orgs, 'token') }));
}

export const createGroupInvitesChannel = (api: Api) =>
    eventChannelFactory<GroupInvitesGetResponse>({
        api,
        channelId: 'group-invites',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: () => ({ url: `pass/v1/invite/group`, method: 'get' }),
        onEvent: onGroupInvitesEvent,
        onClose: () => logger.info(`[${NAMESPACE}] closing channel`),
    });

export function* groupInvitesChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[${NAMESPACE}] start polling`);

    const eventsChannel = createGroupInvitesChannel(api);
    const events = fork(channelEvents<GroupInvitesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelInitalize<GroupInvitesGetResponse>, eventsChannel, options);

    yield all([events, wakeup]);
}
