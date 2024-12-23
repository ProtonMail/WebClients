import type { Reducer } from 'redux';

import {
    aliasDetailsSync,
    getAliasDetailsSuccess,
    itemCreationIntent,
    itemEditIntent,
    requestAliasOptions,
} from '@proton/pass/store/actions';
import type { AliasDetails, Maybe, MaybeNull } from '@proton/pass/types';
import type { AliasOptions } from '@proton/pass/types/data/alias';
import { merge } from '@proton/pass/utils/object/merge';

export type AliasDetailsState = Maybe<Omit<AliasDetails, 'aliasEmail'>>;

export type AliasState = {
    aliasOptions: MaybeNull<AliasOptions>;
    aliasDetails: { [aliasEmail: string]: AliasDetailsState };
};

const getInitialState = (): AliasState => ({ aliasOptions: null, aliasDetails: {} });

const reducer: Reducer<AliasState> = (state = getInitialState(), action) => {
    if (requestAliasOptions.success.match(action)) {
        return merge(state, { aliasOptions: { ...action.payload } });
    }

    if (itemCreationIntent.match(action) && action.payload.type === 'alias') {
        const {
            payload: {
                extraData: { mailboxes, aliasEmail },
            },
        } = action;

        return merge(state, {
            aliasDetails: {
                [aliasEmail]: { mailboxes },
            },
        });
    }

    if (getAliasDetailsSuccess.match(action) || aliasDetailsSync.match(action)) {
        const {
            payload: { aliasEmail, ...aliasDetails },
        } = action;

        return merge(state, { aliasDetails: { [aliasEmail]: aliasDetails } });
    }

    if (
        itemEditIntent.match(action) &&
        action.payload.type === 'alias' &&
        action.payload.extraData &&
        action.payload.extraData.aliasOwner
    ) {
        const {
            extraData: { mailboxes, aliasEmail },
        } = action.payload;
        return merge(state, { aliasDetails: { [aliasEmail]: { mailboxes } } });
    }

    return state;
};

export default reducer;
