import type { Reducer } from 'redux';

import {
    aliasDetailsSync,
    getAliasDetailsSuccess,
    getAliasOptionsSuccess,
    itemCreationIntent,
    itemEditIntent,
} from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import type { AliasMailbox, AliasSuffix } from '@proton/pass/types/data/alias';
import { merge } from '@proton/pass/utils/object/merge';

export type AliasOptions = {
    mailboxes: AliasMailbox[];
    suffixes: AliasSuffix[];
};

export type AliasState = {
    aliasOptions: MaybeNull<AliasOptions>;
    aliasDetails: { [aliasEmail: string]: AliasMailbox[] };
};

const reducer: Reducer<AliasState> = (state = { aliasOptions: null, aliasDetails: {} }, action) => {
    if (getAliasOptionsSuccess.match(action)) {
        return merge(state, { aliasOptions: { ...action.payload.options } });
    }

    if (itemCreationIntent.match(action) && action.payload.type === 'alias') {
        const {
            payload: {
                extraData: { mailboxes, aliasEmail },
            },
        } = action;

        return merge(state, {
            aliasDetails: {
                [aliasEmail]: mailboxes,
            },
        });
    }

    if (getAliasDetailsSuccess.match(action)) {
        const {
            payload: { aliasEmail, mailboxes },
        } = action;
        return merge(state, { aliasDetails: { [aliasEmail]: mailboxes } });
    }

    if (aliasDetailsSync.match(action)) {
        const {
            payload: { aliasEmail, mailboxes },
        } = action;
        return merge(state, { aliasDetails: { [aliasEmail]: mailboxes } });
    }

    if (itemEditIntent.match(action) && action.payload.type === 'alias' && action.payload.extraData.aliasOwner) {
        const {
            extraData: { mailboxes, aliasEmail },
        } = action.payload;
        return merge(state, { aliasDetails: { [aliasEmail]: mailboxes } });
    }

    return state;
};

export default reducer;
