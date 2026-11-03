import { type CSSProperties, type FocusEvent, useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { UserIdentity } from '@proton/atoms/UserIdentity/UserIdentity';
import { GROUP_MEMBERSHIP_STATUS } from '@proton/shared/lib/interfaces/GroupMember';
import type { GroupMembership } from '@proton/shared/lib/interfaces/GroupMember';

import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableCell from '../../../components/table/TableCell';
import TableHeader from '../../../components/table/TableHeader';
import TableHeaderCell from '../../../components/table/TableHeaderCell';
import TableRow from '../../../components/table/TableRow';
import SettingsDescription from '../SettingsDescription';
import GroupActions from './GroupActions';
import GroupState from './GroupState';

// The card has no padding of its own: the cells carry it, also once rows stack on narrow widths
const tableStyle: CSSProperties = {
    '--table-padding': 'var(--space-4)',
    '--table-stacked-padding-inline': 'var(--table-padding)',
    '--table-stacked-padding-block-start': 'var(--table-padding)',
};

const GroupsTable = ({
    memberships,
    showMailFeatures,
    loading,
}: {
    memberships: GroupMembership[];
    showMailFeatures: boolean;
    loading: boolean;
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    // Row that last had focus inside the table, to restore focus when an action replaces or removes its button
    const lastFocusedRowRef = useRef<{ id: string; index: number } | null>(null);

    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
        const row = (event.target as HTMLElement).closest<HTMLElement>('tr[data-membership-id]');
        const rows = Array.from(wrapperRef.current?.querySelectorAll('tr[data-membership-id]') ?? []);
        lastFocusedRowRef.current = row ? { id: row.dataset.membershipId ?? '', index: rows.indexOf(row) } : null;
    };

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        const { relatedTarget } = event;
        const target = event.target as HTMLElement;
        if (relatedTarget) {
            // Focus moved somewhere else on purpose
            if (!wrapperRef.current?.contains(relatedTarget)) {
                lastFocusedRowRef.current = null;
            }
            return;
        }
        // No related target: the user clicked something that can't take focus, or the button is going away (removed
        // or disabled while its action runs). Only the latter should be restored, so check once the update is done
        window.setTimeout(() => {
            const isGoingAway = !target.isConnected || target.matches(':disabled');
            if (!isGoingAway && !wrapperRef.current?.contains(document.activeElement)) {
                lastFocusedRowRef.current = null;
            }
        });
    };

    // Accepting swaps the row's buttons, declining or leaving removes the row: either way the focused button is gone.
    // Only act when focus fell back to the page, so focus is never moved away from somewhere the user put it
    useEffect(() => {
        const lastFocusedRow = lastFocusedRowRef.current;
        const activeElement = document.activeElement;
        if (!lastFocusedRow || (activeElement && activeElement !== document.body)) {
            return;
        }
        const rows = Array.from(wrapperRef.current?.querySelectorAll<HTMLElement>('tr[data-membership-id]') ?? []);
        const row =
            rows.find(({ dataset }) => dataset.membershipId === lastFocusedRow.id) ??
            rows[Math.min(lastFocusedRow.index, rows.length - 1)];
        // Restore once; focusing the button records its row again
        lastFocusedRowRef.current = null;
        row?.querySelector<HTMLElement>('button')?.focus();
    }, [memberships]);

    if (!loading && memberships.length === 0) {
        return (
            <div className="text-bold text-center p-4">
                {c('Info').t`You are not currently in any groups and there are no pending invitations`}
            </div>
        );
    }

    return (
        <div ref={wrapperRef} onFocus={handleFocus} onBlur={handleBlur}>
            {/* Like the emergency contacts table: rows stack when the card gets narrow */}
            <Table borderWeak hasActions responsive="stacked" lastRowNoBorder className="mb-0" style={tableStyle}>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-1/2">{c('Title').t`Name`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Status`}</TableHeaderCell>
                        <TableHeaderCell>
                            <span className="sr-only">{c('Title').t`Action`}</span>
                        </TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody loading={loading} colSpan={3}>
                    {memberships.map((membership) => (
                        // Keyed by ID so a row keeps its components when accepting re-sorts the list
                        <TableRow key={membership.ID} data-membership-id={membership.ID}>
                            <TableCell>
                                {/* Zero width so a long name or address truncates instead of pushing the actions past the card edge */}
                                <UserIdentity
                                    className="w-0 min-w-full"
                                    name={membership.Name}
                                    email={showMailFeatures ? membership.Address : undefined}
                                />
                            </TableCell>
                            <TableCell>
                                <GroupState membership={membership} />
                            </TableCell>
                            <TableCell className="text-left-when-stacked text-nowrap">
                                <GroupActions membership={membership} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const GroupMembershipSection = () => {
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const showMailFeatures = entitlements.hasGroupMail;
    const [originalGroupMemberships, loadingGroupMemberships] = useGroupMemberships();
    const loading = loadingGroupMemberships || loadingEntitlements;

    // Memoized so the list only changes when the memberships do, which GroupsTable relies on to restore focus
    const sortedGroupMemberships = useMemo(() => {
        const groupMemberships: GroupMembership[] = (originalGroupMemberships ?? []).map(
            ({ Group, State, ForwardingKeys, AddressID, ID, Permissions }) => ({
                Name: Group.Name,
                Address: Group.Address,
                Status: State === 0 ? GROUP_MEMBERSHIP_STATUS.UNANSWERED : GROUP_MEMBERSHIP_STATUS.ACTIVE,
                Keys: ForwardingKeys,
                AddressID: AddressID,
                ID,
                Permissions,
            })
        );

        // make status unanswered come first, then sort alphabetically by address
        return groupMemberships.sort((a, b) => {
            if (a.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED && b.Status !== GROUP_MEMBERSHIP_STATUS.UNANSWERED) {
                return -1;
            }
            if (a.Status !== GROUP_MEMBERSHIP_STATUS.UNANSWERED && b.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED) {
                return 1;
            }
            return a.Address.localeCompare(b.Address);
        });
    }, [originalGroupMemberships]);

    return (
        <DashboardGrid>
            <SettingsDescription>
                <SettingsDescription.Item>{c('Info').t`View and manage your groups.`}</SettingsDescription.Item>
            </SettingsDescription>
            <DashboardGridSectionHeader title={c('Title').t`Your groups`} />
            <DashboardCard>
                <DashboardCardContent paddingClass="p-0">
                    <GroupsTable
                        memberships={sortedGroupMemberships}
                        showMailFeatures={showMailFeatures}
                        loading={loading}
                    />
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};

export default GroupMembershipSection;
