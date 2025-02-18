import type { Reducer } from 'redux';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import {
    aliasDetailsSync,
    cancelMailboxEdit,
    createMailbox,
    deleteMailbox,
    editMailbox,
    getAliasDetailsSuccess,
    getMailboxes,
    itemCreate,
    itemEdit,
    requestAliasOptions,
    setDefaultMailbox,
    validateMailbox,
} from '@proton/pass/store/actions';
import type { AliasDetails, Maybe, MaybeNull, UserMailboxOutput } from '@proton/pass/types';
import type { AliasOptions } from '@proton/pass/types/data/alias';
import { or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { objectMap } from '@proton/pass/utils/object/map';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

export type AliasDetailsState = Maybe<Omit<AliasDetails, 'aliasEmail'>>;

export type AliasState = {
    aliasOptions: MaybeNull<AliasOptions>;
    aliasDetails: { [aliasEmail: string]: AliasDetailsState };
    mailboxes: MaybeNull<Record<number, UserMailboxOutput>>;
};

const getInitialState = (): AliasState => ({ aliasOptions: null, aliasDetails: {}, mailboxes: null });

const reducer: Reducer<AliasState> = (state = getInitialState(), action) => {
    if (requestAliasOptions.success.match(action)) {
        return partialMerge(state, { aliasOptions: { ...action.payload } });
    }

    if (itemCreate.intent.match(action) && action.payload.type === 'alias') {
        const { mailboxes, aliasEmail } = action.payload.extraData;
        return partialMerge(state, { aliasDetails: { [aliasEmail]: { mailboxes } } });
    }

    if (getAliasDetailsSuccess.match(action) || aliasDetailsSync.match(action)) {
        const { aliasEmail, ...aliasDetails } = action.payload;
        return partialMerge(state, { aliasDetails: { [aliasEmail]: aliasDetails } });
    }

    if (
        itemEdit.intent.match(action) &&
        action.payload.type === 'alias' &&
        action.payload.extraData &&
        action.payload.extraData.aliasOwner
    ) {
        const { mailboxes, aliasEmail } = action.payload.extraData;
        return partialMerge(state, { aliasDetails: { [aliasEmail]: { mailboxes } } });
    }

    if (getMailboxes.success.match(action)) {
        return { ...state, mailboxes: toMap(action.payload, 'MailboxID') };
    }

    if (or(createMailbox.success.match, editMailbox.success.match, validateMailbox.success.match)(action)) {
        const { MailboxID } = action.payload;
        return partialMerge(state, { mailboxes: { [MailboxID]: action.payload } });
    }

    if (setDefaultMailbox.success.match(action) && state.mailboxes) {
        return partialMerge(state, {
            mailboxes: objectMap(state.mailboxes, (_, mailbox) => ({
                ...mailbox,
                IsDefault: !(mailbox.IsDefault || mailbox.MailboxID !== action.payload.DefaultMailboxID),
            })),
        });
    }

    if (cancelMailboxEdit.success.match(action) && state.mailboxes) {
        return partialMerge(state, {
            mailboxes: objectMap(state.mailboxes, (_, mailbox) => ({
                ...mailbox,
                PendingEmail: mailbox.MailboxID === action.payload ? null : mailbox.PendingEmail,
            })),
        });
    }

    if (
        (deleteMailbox.success.match(action) ||
            (validateMailbox.failure.match(action) && action.error.code === PassErrorCode.NOT_ALLOWED)) &&
        state.mailboxes
    ) {
        return { ...state, mailboxes: objectDelete(state.mailboxes, action.payload.mailboxID) };
    }

    return state;
};

export default reducer;
