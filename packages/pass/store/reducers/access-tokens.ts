import type { Reducer } from 'redux';

import type { DecodedPatMonitorRecord, PersonalAccessToken } from '../../lib/access-token/access-token.types';
import type { MaybeNull, PersonalAccessTokenShareResponse } from '../../types';
import { or } from '../../utils/fp/predicates';
import { objectDelete } from '../../utils/object/delete';
import {
    createAccessToken,
    deleteAccessToken,
    getAccessTokenActions,
    getAccessTokenGrants,
    getAccessTokens,
    updateAccessTokenAccess,
} from '../actions';

export type AccessTokenActionsState = {
    records: DecodedPatMonitorRecord[];
    nextSince: MaybeNull<string>;
};

export type AccessTokenState = {
    tokens: PersonalAccessToken[];
    grants: { [tokenId: string]: PersonalAccessTokenShareResponse[] };
    actions: { [tokenId: string]: AccessTokenActionsState };
};

export const getInitialPATState = (): AccessTokenState => ({ tokens: [], grants: {}, actions: {} });

const reducer: Reducer<AccessTokenState> = (state = getInitialPATState(), action) => {
    if (getAccessTokens.success.match(action)) return { ...state, tokens: action.payload };

    if (createAccessToken.success.match(action)) {
        const { pat } = action.payload;
        const tokens = state.tokens.filter((t) => t.PersonalAccessTokenID !== pat.PersonalAccessTokenID);
        return { ...state, tokens: tokens.concat(pat) };
    }

    if (deleteAccessToken.success.match(action)) {
        const id = action.payload;
        return {
            ...state,
            tokens: state.tokens.filter((t) => t.PersonalAccessTokenID !== id),
            grants: objectDelete(state.grants, id),
            actions: objectDelete(state.actions, id),
        };
    }

    if (or(getAccessTokenGrants.success.match, updateAccessTokenAccess.success.match)(action)) {
        const { tokenId, grants } = action.payload;
        return { ...state, grants: { ...state.grants, [tokenId]: grants } };
    }

    if (getAccessTokenActions.success.match(action)) {
        const { tokenId, records, nextSince, append } = action.payload;
        const previous = append ? (state.actions[tokenId]?.records ?? []) : [];

        return {
            ...state,
            actions: {
                ...state.actions,
                [tokenId]: {
                    records: previous.concat(records),
                    nextSince,
                },
            },
        };
    }

    return state;
};

export default reducer;
