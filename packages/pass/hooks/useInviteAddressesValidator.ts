import { type MutableRefObject, useMemo, useRef } from 'react';

import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import type { inviteAddressesValidateFailure, inviteAddressesValidateSuccess } from '@proton/pass/store/actions';
import { inviteAddressesValidateIntent } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { BitField } from '@proton/pass/types';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { useActionRequest } from './useRequest';

type InviteAddressesCache = Map<string, boolean>;
export interface InviteAddressValidator {
    validate: (addresses: string[]) => Promise<void>;
    emails: MutableRefObject<InviteAddressesCache>;
    loading: boolean;
}

export const useInviteAddressesValidator = (shareId: string): MaybeNull<InviteAddressValidator> => {
    const org = useOrganization({ sync: true });
    const shouldValidate = !org?.b2bAdmin && org?.settings.ShareMode === BitField.ACTIVE;

    /** keeps track of valid/invalid email addresses in a map
     * in order to only request new emails to validate*/
    const cache = useRef<InviteAddressesCache>(new Map());
    const pending = useRef<Awaiter<void>>();

    const validateAddresses = useActionRequest<
        typeof inviteAddressesValidateIntent,
        typeof inviteAddressesValidateSuccess,
        typeof inviteAddressesValidateFailure
    >(inviteAddressesValidateIntent, {
        onSuccess: ({ data }) => {
            Object.entries(data).forEach(([email, valid]) => cache.current.set(email, valid));
            pending.current?.resolve();
        },
    });

    return useMemo(
        () =>
            shouldValidate
                ? {
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
                  }
                : null,
        [validateAddresses, shouldValidate]
    );
};
