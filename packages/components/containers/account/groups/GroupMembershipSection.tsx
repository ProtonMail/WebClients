import { c } from 'ttag';

import type { GroupMembership } from '@proton/shared/lib/interfaces';

import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components';
import { SettingsParagraph, SettingsSectionWide } from '../../account';
import GroupActions from './GroupActions';
import GroupState from './GroupState';
import useGroupMemberships from './useGroupMembership';

const GroupsTable = ({ memberships }: { memberships: GroupMembership[] }) => {
    const isEmpty = memberships.length === 0;

    return (
        <>
            {isEmpty && c('Info').t`You are in no group nor invited to any`}
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
                                            c('Title').t`Amount`,
                                            c('Title').t`Type`,
                                            c('Title').t`Status`,
                                            c('Title').t`Date`,
                                            '',
                                        ]}
                                        cells={[
                                            membership.Name,
                                            membership.Address,
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
    const { groupMemberships, loading } = useGroupMemberships();

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
                {!loading && <GroupsTable memberships={sortedGroupMemberships} />}
            </SettingsSectionWide>
        </>
    );
};

export default GroupMembershipSection;
