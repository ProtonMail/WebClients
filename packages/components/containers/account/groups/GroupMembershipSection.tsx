import { c } from 'ttag';

import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import Loader from '@proton/components/components/loader/Loader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { GroupMembership } from '@proton/shared/lib/interfaces';

import GroupActions from './GroupActions';
import GroupState from './GroupState';

const GroupsTable = ({ memberships }: { memberships: GroupMembership[] }) => {
    const isEmpty = memberships.length === 0;

    return (
        <>
            {isEmpty && c('Info').t`You are not currently in any groups and there are no pending invitations`}
            {!isEmpty && (
                <div style={{ overflow: 'auto' }}>
                    <Table hasActions responsive="cards">
                        <TableHeader>
                            <TableRow>
                                <TableCell type="header">{c('Title').t`Group`}</TableCell>
                                <TableCell type="header">{c('Title').t`Address`}</TableCell>
                                <TableCell type="header">{c('Title').t`Status`}</TableCell>
                                <TableCell type="header">{c('Title').t`Action`}</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody colSpan={6}>
                            {memberships.map((membership, index) => {
                                const key = index.toString();
                                return (
                                    <TableRow
                                        key={key}
                                        labels={[
                                            c('Title').t`Group`,
                                            c('Title').t`Address`,
                                            c('Title').t`Status`,
                                            c('Title').t`Action`,
                                            '',
                                        ]}
                                        cells={[
                                            <span className="block max-w-full text-ellipsis" title={membership.Name}>
                                                {membership.Name}
                                            </span>,
                                            <span className="block max-w-full text-ellipsis" title={membership.Address}>
                                                {membership.Address}
                                            </span>,
                                            <GroupState key={key} membership={membership} />,
                                            <GroupActions key={key} membership={membership} />,
                                        ]}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </>
    );
};

const GroupMembershipSection = () => {
    const [originalGroupMemberships, loading] = useGroupMemberships();

    const groupMemberships: GroupMembership[] = (originalGroupMemberships ?? []).map(
        ({ Group, State, ForwardingKeys, AddressId, ID, Permissions }) => ({
            Name: Group.Name,
            Address: Group.Address,
            Status: State === 0 ? 'unanswered' : 'active',
            Keys: ForwardingKeys,
            AddressID: AddressId,
            ID,
            Permissions,
        })
    );

    // make status unanswered come first, then sort alphabetically by address
    const sortedGroupMemberships = [...groupMemberships].sort((a, b) => {
        if (a.Status === 'unanswered' && b.Status !== 'unanswered') {
            return -1;
        }
        if (a.Status !== 'unanswered' && b.Status === 'unanswered') {
            return 1;
        }
        return a.Address.localeCompare(b.Address);
    });

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`View and manage your groups.`}</SettingsParagraph>
                {loading && <Loader />}
                {!loading && <GroupsTable memberships={sortedGroupMemberships} />}
            </SettingsSectionWide>
        </>
    );
};

export default GroupMembershipSection;
