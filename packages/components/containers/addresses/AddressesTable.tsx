import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import type {
    Address,
    CachedOrganizationKey,
    Member,
    PartialMemberAddress,
    UserModel,
} from '@proton/shared/lib/interfaces';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import { getPermissions, getStatus } from './helper';

interface AddressesTableProps {
    loading: boolean;
    hasUsername: boolean;
    user: UserModel;
    members: Member[];
    memberAddressesMap?: { [key: string]: (Address | PartialMemberAddress)[] | undefined };
    organizationKey?: CachedOrganizationKey;
    allowAddressDeletion: boolean;
}

const AddressesTable = ({
    loading,
    hasUsername,
    user,
    members,
    memberAddressesMap,
    organizationKey,
    allowAddressDeletion,
}: AddressesTableProps) => {
    return (
        <Table responsive="cards" hasActions>
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
                    const memberAddresses = memberAddressesMap?.[member.ID] || [];
                    return memberAddresses.map((address, i) => {
                        const emailCell = (
                            <div className="text-ellipsis" title={address.Email}>
                                {address.Email}
                            </div>
                        );
                        const nameCell = hasUsername && member.Name;

                        // Partial address getting loaded
                        if (!('Keys' in address)) {
                            return (
                                <TableRow
                                    key={address.ID}
                                    cells={[
                                        emailCell,
                                        nameCell,
                                        <div className="visibility-hidden">
                                            <AddressStatus isActive />
                                        </div>,
                                        <CircleLoader />,
                                    ].filter(Boolean)}
                                />
                            );
                        }

                        return (
                            <TableRow
                                key={address.ID}
                                cells={[
                                    emailCell,
                                    nameCell,
                                    <AddressStatus {...getStatus(address, i)} />,
                                    <AddressActions
                                        member={member}
                                        address={address}
                                        user={user}
                                        permissions={getPermissions({
                                            addressIndex: i,
                                            member,
                                            address,
                                            addresses: memberAddresses,
                                            user,
                                            organizationKey,
                                        })}
                                        allowAddressDeletion={allowAddressDeletion}
                                    />,
                                ].filter(Boolean)}
                            />
                        );
                    });
                })}
            </TableBody>
        </Table>
    );
};

export default AddressesTable;
