import { createSelector } from '@reduxjs/toolkit';

import type { PersonalAccessToken } from '../../lib/access-token/access-token.types';
import type { Maybe } from '../../types';
import { sortOn } from '../../utils/fp/sort';
import type { AccessTokenState } from '../reducers/access-tokens';
import type { State } from '../types';

export const selectAccessTokenState = ({ accessTokens }: State): AccessTokenState => accessTokens;

export const selectAccessTokens = createSelector(selectAccessTokenState, (state): PersonalAccessToken[] =>
    state.tokens.toSorted(sortOn('CreateTime'))
);

export const selectAccessTokenById = (tokenId: string) =>
    createSelector(selectAccessTokenState, (state): Maybe<PersonalAccessToken> =>
        state.tokens.find((t) => t.PersonalAccessTokenID === tokenId)
    );

export const selectAccessTokenGrants = (tokenId: string) => createSelector(selectAccessTokenState, (state) => state.grants[tokenId] ?? []);

const EMPTY_ACTIONS = { records: [], nextSince: null } as const;

export const selectAccessTokenActions = (tokenId: string) =>
    createSelector(selectAccessTokenState, (state) => state.actions[tokenId] ?? EMPTY_ACTIONS);
