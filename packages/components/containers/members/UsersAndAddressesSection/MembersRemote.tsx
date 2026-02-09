import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMembersRemote } from '@proton/account/members/useMembersRemote';
import SearchInput from '@proton/components/components/input/SearchInput';
import Pagination from '@proton/components/components/pagination/Pagination';
import { MembersTable } from '@proton/components/containers/members/UsersAndAddressesSection/MembersTable';
import { MembersTableHeader } from '@proton/components/containers/members/UsersAndAddressesSection/MembersTableHeader';
import { useMemberActions } from '@proton/components/containers/members/UsersAndAddressesSection/useMemberActions';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';

export const MembersRemote = ({ app }: { app: APP_NAMES }) => {
    const [page, setPage] = useState(1);
    const [keywords, setKeywords] = useState('');

    const {
        data: rawMembers,
        loading: loadingMembers,
        sync: syncMembers,
        total,
        totalPages,
    } = useMembersRemote({ page, pageSize: 10, keywords });

    // The actual page considers the total pages and the page number, it's used to display the correct page number in the pagination UI
    const actualPage = useMemo(() => Math.min(page, totalPages), [page, totalPages]);

    // convert raw members to enhanced members with partial addresses to prevent fetching addresses for each member in useMemberAddresses
    const members = useMemo(
        () => rawMembers.map((member): EnhancedMember => ({ ...member, addressState: 'partial' })),
        [rawMembers]
    );

    const membersHook = useMemberActions({ app, members, loadingMembers, syncMembers });

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

            <MembersTable members={members} loadingMembers={loadingMembers} membersHook={membersHook} />

            <div className="text-center">
                <Pagination
                    total={total}
                    limit={10}
                    onSelect={(page) => setPage(page)}
                    page={actualPage}
                    onNext={() => setPage(actualPage + 1)}
                    onPrevious={() => setPage(actualPage - 1)}
                    hasNext={actualPage < totalPages}
                    hasPrevious={actualPage > 1}
                />
            </div>
        </>
    );
};
