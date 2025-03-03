import { createSelector } from '@reduxjs/toolkit';

import { toShareAccessKey } from '@proton/pass/lib/access/access.utils';
import type { AccessItem, AccessKeys } from '@proton/pass/lib/access/types';
import type { AccessState } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import { prop } from '@proton/pass/utils/fp/lens';

import { SelectorError } from './errors';

const DEFAULT_ACCESS: AccessItem = {
    members: [],
    invites: [],
    newUserInvites: [],
};

export const selectAccessState = (state: State) => state.access;
const getAccess = (access: AccessState, key: string) => access[key] || DEFAULT_ACCESS;

export const selectAccess =
    (shareId: string, itemId?: string) =>
    ({ access }: State) =>
        getAccess(access, toShareAccessKey({ shareId, itemId }));

export const selectAccessOrThrow = (shareId: string, itemId?: string) =>
    createSelector([selectAccess(shareId, itemId)], (access) => {
        if (!access) throw new SelectorError(`Access item for key ${toShareAccessKey({ shareId, itemId })} not found`);
        return access;
    });

export const selectAccessMembers = (shareId: string, itemId?: string) =>
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

export const selectAccessForMany = (dtos: AccessKeys[]) =>
    createSelector(selectAccessState, (access) =>
        Object.fromEntries(
            new Map(
                dtos.map((dto) => {
                    const stateKey = toShareAccessKey(dto);
                    return [stateKey, getAccess(access, stateKey)];
                })
            )
        )
    );
