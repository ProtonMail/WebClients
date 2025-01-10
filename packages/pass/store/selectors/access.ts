import { createSelector } from '@reduxjs/toolkit';

import { toShareAccessKey } from '@proton/pass/lib/access/access.utils';
import { selectState } from '@proton/pass/store/selectors/utils';
import { prop } from '@proton/pass/utils/fp/lens';

import type { AccessItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';

export type SelectAccessDTO = { shareId: string; itemId?: string };

const DEFAULT_ACCESS: AccessItem = {
    members: [],
    invites: [],
    newUserInvites: [],
};

export const selectAccess =
    (shareId: string, itemId?: string) =>
    ({ access }: State) =>
        access[toShareAccessKey({ shareId, itemId })] || DEFAULT_ACCESS;

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

export const selectAccessForMany = createSelector(
    [selectState, (_: State, dto: SelectAccessDTO[]) => dto],
    (state: State, dtos) =>
        Object.fromEntries(
            new Map(
                dtos.map((dto) => {
                    const stateKey = toShareAccessKey(dto);
                    return [stateKey, selectAccess(stateKey)(state)];
                })
            )
        )
);
