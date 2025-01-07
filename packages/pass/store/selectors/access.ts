import { createSelector } from '@reduxjs/toolkit';

import { toShareAccessKey } from '@proton/pass/lib/access/access.utils';
import { prop } from '@proton/pass/utils/fp/lens';

import type { AccessItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';

const defaultAccess: AccessItem = {
    members: [],
    invites: [],
    newUserInvites: [],
};

export const selectAccess =
    (shareId: string, itemId?: string) =>
    ({ access }: State) =>
        access[toShareAccessKey({ shareId, itemId })] || defaultAccess;

export const selectAccessOrThrow = (shareId: string, itemId?: string) => (state: State) => {
    const item = selectAccess(shareId, itemId)(state);
    if (!item) throw new SelectorError(`Access item for key ${toShareAccessKey({ shareId, itemId })} not found`);
    return item;
};

export const selectAccessSharedWithEmails = (shareId: string, itemId?: string) =>
    createSelector(
        selectAccess(shareId, itemId),
        (access): Set<string> =>
            new Set(
                access.members
                    .map(prop('email'))
                    .concat(access.invites.map(prop('invitedEmail')))
                    .concat(access.newUserInvites.map(prop('invitedEmail')))
            )
    );

export const selectAccessForMany = (targets: { shareId: string; itemId?: string }[]) => (state: State) =>
    Object.fromEntries(
        new Map(
            targets.map((t) => {
                const stateKey = toShareAccessKey(t);
                return [stateKey, selectAccess(stateKey)(state)];
            })
        )
    );
