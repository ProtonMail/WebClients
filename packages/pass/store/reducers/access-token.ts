import type { Reducer } from 'redux';

import type { PersonalAccessToken, PersonalAccessTokenAccessGrant } from '@proton/pass/lib/access-token/access-token.types';
import {
    createAccessToken,
    deleteAccessToken,
    getAccessTokenAccess,
    getAccessTokens,
    updateAccessTokenAccess,
} from '@proton/pass/store/actions';

export type AccessTokenState = {
    tokens: PersonalAccessToken[];
    grants: { [tokenId: string]: PersonalAccessTokenAccessGrant[] };
};

const getInitialState = (): AccessTokenState => ({ tokens: [], grants: {} });

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
        delete remainingGrants[id];
        return {
            ...state,
            tokens: state.tokens.filter((t) => t.PersonalAccessTokenID !== id),
            grants: remainingGrants,
        };
    }

    if (getAccessTokenAccess.success.match(action) || updateAccessTokenAccess.success.match(action)) {
        const { tokenId, grants } = action.payload;
        return { ...state, grants: { ...state.grants, [tokenId]: grants } };
    }

    return state;
};

export default reducer;
