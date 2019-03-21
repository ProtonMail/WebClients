import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { useMembers, Table, TableHeader, TableBody, TableRow, Info } from 'react-components';

import AddressStatus from './AddressStatus';
import AddressCatchAll from './AddressCatchAll';

const AddressesTable = ({ domain }) => {
    const [members = []] = useMembers();

    const getMemberName = (memberID) => {
        const { Name = '' } = members.find(({ ID }) => memberID === ID) || {};
        return Name;
    };
    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for addresses domain table').t`Address`,
                    c('Title header for addresses domain table').t`Name`,
                    c('Title header for addresses domain table').t`Status`,
                    <>
                        {c('Title header for addresses domain table').t`Catch all`}
                        <Info url="https://protonmail.com/support/knowledge-base/catch-all/" />
                    </>
                ]}
            />
            <TableBody loading={members.loading} colSpan={4}>
                {domain.addresses.map((address) => {
                    const key = address.ID;
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                address.Email,
                                getMemberName(address.MemberID),
                                <AddressStatus key={key} address={address} />,
                                <AddressCatchAll key={key} address={address} domain={domain} />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

AddressesTable.propTypes = {
    domain: PropTypes.object.isRequired
};

export default AddressesTable;
