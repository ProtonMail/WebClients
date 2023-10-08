import { createSelector } from '@reduxjs/toolkit';

import type { Maybe } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';

import type { AliasState } from '../reducers';
import type { State } from '../types';
import { selectItemsByType } from './items';

export const selectAliasOptions = ({ alias }: State): AliasState['aliasOptions'] => alias.aliasOptions;

export const selectAliasDetails = (aliasEmail: string) =>
    createSelector([({ alias }: State) => alias], (alias): Maybe<AliasMailbox[]> => alias.aliasDetails?.[aliasEmail]);

export const selectAliasByAliasEmail = (aliasEmail: string) =>
    createSelector([selectItemsByType('alias'), () => aliasEmail], (aliasItems, aliasEmail) =>
        aliasItems.find((item) => item.aliasEmail! === aliasEmail)
    );
