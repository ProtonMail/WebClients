import { createSelector } from '@reduxjs/toolkit';

import { isActive, isTrashed } from '@proton/pass/lib/items/item.predicates';
import type { AliasDetailsState } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';
import { prop } from '@proton/pass/utils/fp/lens';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import isTruthy from '@proton/utils/isTruthy';

import { selectAliasItems, selectLoginItems } from './items';

export const selectAliasState = ({ alias }: State) => alias;
export const selectAliasOptions = ({ alias }: State) => alias.aliasOptions;
export const selectAliasMailboxes = ({ alias }: State) => alias.mailboxes;

export const selectAliasDetails = (aliasEmail: string) =>
    createSelector([selectAliasState], (alias): Maybe<AliasDetailsState> => alias.aliasDetails?.[aliasEmail]);

export const selectMailboxesForAlias = (aliasEmail: string) =>
    createSelector([selectAliasState], (alias): Maybe<AliasMailbox[]> => alias.aliasDetails?.[aliasEmail]?.mailboxes);

export const selectAliasByAliasEmail = (aliasEmail: string) =>
    createSelector(
        [selectAliasItems],
        (aliasItems): Maybe<ItemRevision<'alias'>> => aliasItems.find((item) => item.aliasEmail! === aliasEmail)
    );

export const selectCanManageAlias = ({ user: { plan } }: State) => Boolean(plan?.ManageAlias);

export const selectTrashedAliasCount = createSelector(selectAliasItems, (items) => items.filter(isTrashed).length);

/** Filters out all login items which were created from an alias item */
export const selectNonAliasedLoginItems = createSelector([selectLoginItems, selectAliasItems], (logins, aliases) => {
    const aliasEmails = new Set<string>(aliases.map(prop('aliasEmail')).filter(isTruthy));
    return logins.filter((item) => isActive(item) && !aliasEmails.has(deobfuscate(item.data.content.itemEmail)));
});
