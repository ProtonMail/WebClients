import { createSelector } from '@reduxjs/toolkit';

import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import type { AccessTokenState } from '@proton/pass/store/reducers/access-tokens';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { sortOn } from '@proton/pass/utils/fp/sort';

export const selectAccessTokenState = ({ accessTokens }: State): AccessTokenState => accessTokens;

export const selectAccessTokens = createSelector(selectAccessTokenState, (state): PersonalAccessToken[] =>
    state.tokens.toSorted(sortOn('CreateTime'))
);

export const selectAccessTokenById = (tokenId: string) =>
    createSelector(
        selectAccessTokenState,
        (state): Maybe<PersonalAccessToken> => state.tokens.find((t) => t.PersonalAccessTokenID === tokenId)
    );

export const selectAccessTokenGrants = (tokenId: string) => createSelector(selectAccessTokenState, (state) => state.grants[tokenId] ?? []);

const EMPTY_ACTIONS = { records: [], nextSince: null } as const;

export const selectAccessTokenActions = (tokenId: string) =>
    createSelector(selectAccessTokenState, (state) => state.actions[tokenId] ?? EMPTY_ACTIONS);
