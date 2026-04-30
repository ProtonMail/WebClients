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
import { objectDelete } from '@proton/pass/utils/object/delete';

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
        return {
            ...state,
            tokens: state.tokens.filter((t) => t.PersonalAccessTokenID !== id),
            grants: objectDelete(state.grants, id),
            actions: objectDelete(state.actions, id),
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
