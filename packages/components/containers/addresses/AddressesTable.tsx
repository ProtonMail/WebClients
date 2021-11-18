import { c } from 'ttag';
import { Address, CachedOrganizationKey, Member, UserModel } from '@proton/shared/lib/interfaces';

import { Table, TableHeader, TableBody, TableRow } from '../../components';
import { formatAddresses, getPermissions, getStatus } from './helper';
import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';

interface AddressesTableProps {
    loading: boolean;
    hasUsername: boolean;
    user: UserModel;
    members: Member[];
    memberAddresses?: { [key: string]: Address[] };
    organizationKey?: CachedOrganizationKey;
}

const AddressesTable = ({
    loading,
    hasUsername,
    user,
    members,
    memberAddresses,
    organizationKey,
}: AddressesTableProps) => {
    return (
        <Table className="simple-table--has-actions">
            <TableHeader
                cells={[
                    c('Header for addresses table').t`Address`,
                    hasUsername ? c('Header for addresses table').t`Username` : null,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`,
                ].filter(Boolean)}
            />
            <TableBody colSpan={hasUsername ? 4 : 3} loading={loading}>
                {members.flatMap((member) => {
                    const formattedAddresses = formatAddresses(memberAddresses?.[member.ID] || []);
                    return formattedAddresses.map((address, i) => (
                        <TableRow
                            key={address.ID}
                            cells={[
                                <div className="text-ellipsis" title={address.Email}>
                                    {address.Email}
                                </div>,
                                hasUsername && member.Name,
                                <AddressStatus {...getStatus(address, i)} />,
                                <AddressActions
                                    member={member}
                                    address={address}
                                    organizationKey={organizationKey}
                                    permissions={getPermissions({
                                        addressIndex: i,
                                        member,
                                        address,
                                        addresses: formattedAddresses,
                                        user,
                                        organizationKey,
                                    })}
                                />,
                            ].filter(Boolean)}
                        />
                    ));
                })}
            </TableBody>
        </Table>
    );
};

export default AddressesTable;
