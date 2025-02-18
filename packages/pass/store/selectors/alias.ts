import { createSelector } from '@reduxjs/toolkit';

import type { AliasDetailsState } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';

import { selectAliasItems } from './items';

export const selectAliasState = ({ alias }: State) => alias;
export const selectAliasOptions = ({ alias }: State) => alias.aliasOptions;
export const selectAliasMailboxes = ({ alias }: State) => alias.mailboxes;

export const selectAliasDetails = (aliasEmail: string) =>
    createSelector([selectAliasState], (alias): Maybe<AliasDetailsState> => alias.aliasDetails?.[aliasEmail]);

export const selectMailboxesForAlias = (aliasEmail: string) =>
    createSelector([selectAliasState], (alias): Maybe<AliasMailbox[]> => alias.aliasDetails?.[aliasEmail]?.mailboxes);

export const selectAliasByAliasEmail = (aliasEmail: string) =>
    createSelector([selectAliasItems], (aliasItems) => aliasItems.find((item) => item.aliasEmail! === aliasEmail));

export const selectCanManageAlias = ({ user: { plan } }: State) => Boolean(plan?.ManageAlias);
