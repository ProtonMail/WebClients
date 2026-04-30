import type { Reducer } from 'redux';

import type { DecodedPatMonitorRecord, PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import {
    createAccessToken,
    deleteAccessToken,
    getAccessTokenActions,
    getAccessTokenGrants,
    getAccessTokens,
    updateAccessTokenAccess,
} from '@proton/pass/store/actions';
import type { PersonalAccessTokenShareResponse } from '@proton/pass/types';

export type AccessTokenActionsState = {
    records: DecodedPatMonitorRecord[];
    nextSince: string | null;
};

export type AccessTokenState = {
    tokens: PersonalAccessToken[];
    grants: { [tokenId: string]: PersonalAccessTokenShareResponse[] };
    actions: { [tokenId: string]: AccessTokenActionsState };
};

const getInitialState = (): AccessTokenState => ({ tokens: [], grants: {}, actions: {} });

const reducer: Reducer<AccessTokenState> = (state = getInitialState(), action) => {
    if (getAccessTokens.success.match(action)) {
        return { ...state, tokens: action.payload };
    }

    if (createAccessToken.success.match(action)) {
        const { pat } = action.payload;
        return {
            ...state,
            tokens: [pat, ...state.tokens.filter((t) => t.PersonalAccessTokenID !== pat.PersonalAccessTokenID)],
        };
    }

    if (deleteAccessToken.success.match(action)) {
        const id = action.payload;
        const remainingGrants = { ...state.grants };
        const remainingActions = { ...state.actions };
        delete remainingGrants[id];
        delete remainingActions[id];
        return {
            ...state,
            tokens: state.tokens.filter((t) => t.PersonalAccessTokenID !== id),
            grants: remainingGrants,
            actions: remainingActions,
        };
    }

    if (getAccessTokenGrants.success.match(action) || updateAccessTokenAccess.success.match(action)) {
        const { tokenId, grants } = action.payload;
        return { ...state, grants: { ...state.grants, [tokenId]: grants } };
    }

    if (getAccessTokenActions.success.match(action)) {
        const { tokenId, records, nextSince, append } = action.payload;
        const previous = append ? (state.actions[tokenId]?.records ?? []) : [];
        return {
            ...state,
            actions: { ...state.actions, [tokenId]: { records: [...previous, ...records], nextSince } },
        };
    }

    return state;
};

export default reducer;
