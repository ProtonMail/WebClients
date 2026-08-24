import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { useMembersUsage } from '@proton/account/members/useMembersUsage';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { normalize } from '@proton/shared/lib/helpers/string';
import { ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';
import noop from '@proton/utils/noop';

import SearchInput from '../../../components/input/SearchInput';
import RoleAssignmentPausedBanner from '../rolesAndPermissions/RoleAssignmentPausedBanner';
import { MembersTable } from './MembersTable';
import { MembersTableHeader } from './MembersTableHeader';
import { useMemberActions } from './useMemberActions';

export const MembersLocal = ({ app, showUsage = false }: { app: APP_NAMES; showUsage?: boolean }) => {
    const [keywords, setKeywords] = useState('');
    const [members, loadingMembers] = useMembers();

    const membersHook = useMemberActions({ app, members, loadingMembers, syncMembers: noop });

    // Fetch usage once for the full member list; client-side search just re-renders over the cached map.
    const memberIDs = useMemo(() => (members ?? []).map((member) => member.ID), [members]);
    const membersUsage = useMembersUsage(memberIDs, showUsage);

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

            <RoleAssignmentPausedBanner
                roleAssignmentSource={ROLE_SOURCE.USER}
                pausedCount={membersHook.meta.pausedMembers.length}
                isResuming={membersHook.meta.resumingMemberID !== undefined}
                onToggle={() => membersHook.actions.handleToggleRoleAssignments()}
            />

            <span className="sr-only" aria-live="polite" aria-atomic="true">
                {c('Info').ngettext(msgid`${total} user found`, `${total} users found`, total)}
            </span>

            <MembersTable
                members={filteredMembers}
                loadingMembers={loadingMembers}
                membersHook={membersHook}
                membersUsage={showUsage ? membersUsage : undefined}
            />
        </>
    );
};
