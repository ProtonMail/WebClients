import { Reducer } from 'redux';

import { AliasMailbox, AliasSuffix } from '@proton/pass/types/data/alias';
import { merge } from '@proton/pass/utils/object';

import {
    aliasDetailsEditSuccess,
    aliasDetailsRequestSuccess,
    aliasOptionsRequestSuccess,
    itemCreationIntent,
    itemEditIntent,
} from '../actions';

export type AliasState = {
    aliasOptions: {
        mailboxes: AliasMailbox[];
        suffixes: AliasSuffix[];
    } | null;
    aliasDetails: { [aliasEmail: string]: AliasMailbox[] };
};

const reducer: Reducer<AliasState> = (state = { aliasOptions: null, aliasDetails: {} }, action) => {
    if (aliasOptionsRequestSuccess.match(action)) {
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

    if (aliasDetailsRequestSuccess.match(action)) {
        const {
            payload: { aliasEmail, mailboxes },
        } = action;
        return merge(state, { aliasDetails: { [aliasEmail]: mailboxes } });
    }

    if (aliasDetailsEditSuccess.match(action)) {
        const {
            payload: { aliasEmail, mailboxes },
        } = action;
        return merge(state, { aliasDetails: { [aliasEmail]: mailboxes } });
    }

    if (itemEditIntent.match(action) && action.payload.type === 'alias') {
        const {
            extraData: { mailboxes, aliasEmail },
        } = action.payload;
        return merge(state, { aliasDetails: { [aliasEmail]: mailboxes } });
    }

    return state;
};

export default reducer;
