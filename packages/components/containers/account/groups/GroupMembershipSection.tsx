import { c } from 'ttag';

import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import type { GroupMembership } from '@proton/shared/lib/interfaces';

import Loader from '../../../components/loader/Loader';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableCell from '../../../components/table/TableCell';
import TableHeader from '../../../components/table/TableHeader';
import TableRow from '../../../components/table/TableRow';
import shouldShowMail from '../../organization/groups/shouldShowMail';
import SettingsParagraph from '../SettingsParagraph';
import SettingsSectionWide from '../SettingsSectionWide';
import GroupActions from './GroupActions';
import GroupState from './GroupState';

const GroupsTable = ({
    memberships,
    showMailFeatures,
}: {
    memberships: GroupMembership[];
    showMailFeatures: boolean;
}) => {
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
                                {showMailFeatures && <TableCell type="header">{c('Title').t`Address`}</TableCell>}
                                <TableCell type="header">{c('Title').t`Status`}</TableCell>
                                <TableCell type="header">{c('Title').t`Action`}</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody colSpan={showMailFeatures ? 6 : 5}>
                            {memberships.map((membership, index) => {
                                const key = index.toString();
                                return (
                                    <TableRow
                                        key={key}
                                        labels={[
                                            c('Title').t`Group`,
                                            ...(showMailFeatures ? [c('Title').t`Address`] : []),
                                            c('Title').t`Status`,
                                            c('Title').t`Action`,
                                            '',
                                        ]}
                                        cells={[
                                            <span className="block max-w-full text-ellipsis" title={membership.Name}>
                                                {membership.Name}
                                            </span>,
                                            ...(showMailFeatures
                                                ? [
                                                      <span
                                                          className="block max-w-full text-ellipsis"
                                                          title={membership.Address}
                                                      >
                                                          {membership.Address}
                                                      </span>,
                                                  ]
                                                : []),
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
    const [organization] = useOrganization();
    const showMailFeatures = shouldShowMail(organization?.PlanName);
    const [originalGroupMemberships, loading] = useGroupMemberships();

    const groupMemberships: GroupMembership[] = (originalGroupMemberships ?? []).map(
        ({ Group, State, ForwardingKeys, AddressID, ID, Permissions }) => ({
            Name: Group.Name,
            Address: Group.Address,
            Status: State === 0 ? 'unanswered' : 'active',
            Keys: ForwardingKeys,
            AddressID: AddressID,
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
                {!loading && <GroupsTable memberships={sortedGroupMemberships} showMailFeatures={showMailFeatures} />}
            </SettingsSectionWide>
        </>
    );
};

export default GroupMembershipSection;
