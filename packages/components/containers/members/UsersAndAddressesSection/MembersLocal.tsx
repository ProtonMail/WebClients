import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import SearchInput from '@proton/components/components/input/SearchInput';
import { MembersTable } from '@proton/components/containers/members/UsersAndAddressesSection/MembersTable';
import { MembersTableHeader } from '@proton/components/containers/members/UsersAndAddressesSection/MembersTableHeader';
import { useMemberActions } from '@proton/components/containers/members/UsersAndAddressesSection/useMemberActions';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { normalize } from '@proton/shared/lib/helpers/string';
import noop from '@proton/utils/noop';

export const MembersLocal = ({ app }: { app: APP_NAMES }) => {
    const [keywords, setKeywords] = useState('');
    const [members, loadingMembers] = useMembers();

    const membersHook = useMemberActions({ app, members, loadingMembers, syncMembers: noop });

    const filteredMembers = useMemo(() => {
        if (!members) {
            return [];
        }
        if (!keywords) {
            return members;
        }

        const normalizedWords = normalize(keywords, true);

        return members.filter((member) => {
            const memberAddresses = membersHook.models.memberAddressesMap?.[member.ID] || [];
            const addressMatch = memberAddresses?.some((address) =>
                normalize(address.Email, true).includes(normalizedWords)
            );
            const nameMatch = normalize(member.Name, true).includes(normalizedWords);

            return addressMatch || nameMatch;
        });
    }, [keywords, members]);

    const total = filteredMembers.length;

    return (
        <>
            {membersHook.modals}

            <MembersTableHeader
                membersHook={membersHook}
                app={app}
                searchInput={
                    <SearchInput
                        onChange={(value) => setKeywords(value)}
                        placeholder={c('Placeholder').t`Search for a user or address`}
                        value={keywords}
                        aria-label={c('Placeholder').t`Search users`}
                    />
                }
            />

            <span className="sr-only" aria-live="polite" aria-atomic="true">
                {c('Info').ngettext(msgid`${total} user found`, `${total} users found`, total)}
            </span>

            <MembersTable members={filteredMembers} loadingMembers={loadingMembers} membersHook={membersHook} />
        </>
    );
};
