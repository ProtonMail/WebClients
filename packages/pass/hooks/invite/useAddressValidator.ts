import { type MutableRefObject, useMemo, useRef } from 'react';

import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { inviteAddressesValidateFailure, inviteAddressesValidateSuccess } from '@proton/pass/store/actions';
import { inviteAddressesValidateIntent } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { OrganizationShareMode } from '@proton/pass/types';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

type InviteAddressesCache = Map<string, boolean>;
export interface InviteAddressValidator {
    validate: (addresses: string[]) => Promise<void>;
    emails: MutableRefObject<InviteAddressesCache>;
    loading: boolean;
}

export const useAddressValidator = (shareId: string): MaybeNull<InviteAddressValidator> => {
    const org = useOrganization({ sync: true });
    const shouldValidate = !org?.b2bAdmin && org?.settings.ShareMode === OrganizationShareMode.ONLYSHAREINSIDEORG;

    /** keeps track of valid/invalid email addresses in a map
     * in order to only request new emails to validate*/
    const cache = useRef<InviteAddressesCache>(new Map());
    const pending = useRef<Awaiter<void>>();

    const { loading, revalidate } = useActionRequest<
        typeof inviteAddressesValidateIntent,
        typeof inviteAddressesValidateSuccess,
        typeof inviteAddressesValidateFailure
    >(inviteAddressesValidateIntent, {
        onSuccess: ({ data }) => {
            Object.entries(data).forEach(([email, valid]) => cache.current.set(email, valid));
            pending.current?.resolve();
        },
        onFailure: () => {
            pending.current?.reject('failure');
        },
    });

    return useMemo(
        () =>
            shouldValidate
                ? {
                      validate: async (addresses: string[]) => {
                          const emails = addresses.filter((email) => !cache.current.get(email));

                          try {
                              pending.current?.reject('aborted');
                              pending.current = awaiter();
                              if (emails.length > 0) revalidate({ shareId, emails }, uniqueId());
                              else pending.current.resolve();

                              await pending.current;
                          } catch (err) {
                              if (err === 'failure') emails.forEach((email) => cache.current.set(email, false));
                          }
                      },
                      emails: cache,
                      loading,
                  }
                : null,
        [revalidate, loading, shouldValidate]
    );
};
