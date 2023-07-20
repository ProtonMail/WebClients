import { createSelector } from '@reduxjs/toolkit';

import type { AliasMailbox } from '@proton/pass/types/data/alias';

import type { AliasState } from '../reducers';
import type { State } from '../types';
import { selectItemsByType } from './items';

export const selectAliasOptions = ({ alias }: State): AliasState['aliasOptions'] => alias.aliasOptions;

export const selectMailboxesForAlias =
    (aliasEmail: string) =>
    ({ alias }: State): AliasMailbox[] | undefined =>
        alias.aliasDetails?.[aliasEmail] ?? undefined;

export const selectAliasByAliasEmail = (aliasEmail: string) =>
    createSelector([selectItemsByType('alias'), () => aliasEmail], (aliasItems, aliasEmail) =>
        aliasItems.find((item) => item.aliasEmail! === aliasEmail)
    );
