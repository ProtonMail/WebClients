import { type MutableRefObject, useMemo, useRef } from 'react';

import type { inviteAddressesValidateSuccess } from '@proton/pass/store/actions';
import { inviteAddressesValidateIntent } from '@proton/pass/store/actions';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';

import { uniqueId } from '../utils/string/unique-id';
import { type RequestEntryFromAction, useActionRequest } from './useActionRequest';

type InviteAddressesCache = Map<string, boolean>;
export interface InviteAddressValidator {
    validate: (addresses: string[]) => Promise<void>;
    emails: MutableRefObject<InviteAddressesCache>;
    loading: boolean;
}

export const useValidateInviteAddresses = (shareId: string): InviteAddressValidator => {
    /** keeps track of valid/invalid email addresses in a map
     * in order to only request new emails to validate*/
    const cache = useRef<InviteAddressesCache>(new Map());
    const pending = useRef<Awaiter<void>>();

    const validateAddresses = useActionRequest({
        action: inviteAddressesValidateIntent,
        onSuccess: ({ data }: RequestEntryFromAction<ReturnType<typeof inviteAddressesValidateSuccess>>) => {
            Object.entries(data).forEach(([email, valid]) => cache.current.set(email, valid));
            pending.current?.resolve();
        },
    });

    return useMemo(
        () => ({
            validate: async (addresses: string[]) => {
                pending.current?.reject('aborted');
                pending.current = awaiter();

                const emails = addresses.filter((email) => cache.current.get(email) === undefined);

                if (emails.length > 0) validateAddresses.revalidate({ shareId, emails }, uniqueId());
                else pending.current.resolve();

                await pending.current;
            },
            emails: cache,
            loading: validateAddresses.loading,
        }),
        [validateAddresses]
    );
};
