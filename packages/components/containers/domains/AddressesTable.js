import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow, Info } from 'react-components';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import AddressCatchAll from './AddressCatchAll';

const AddressesTable = ({ domain, members, loading }) => {
    const getMember = (memberID) => members.find(({ ID }) => memberID === ID) || {};
    return (
        <Table>
            <TableHeader
                cells={[
                    '',
                    c('Title header for addresses domain table').t`Address`,
                    c('Title header for addresses domain table').t`Name`,
                    c('Title header for addresses domain table').t`Status`,
                    <>
                        {c('Title header for addresses domain table').t`Catch all`}
                        <Info url="https://protonmail.com/support/knowledge-base/catch-all/" />
                    </>,
                    c('Title header for addresses domain table').t`Actions`
                ]}
            />
            <TableBody loading={loading} colSpan={5}>
                {domain.addresses.map((address, index) => {
                    const key = address.ID;
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                `${index + 1}.`,
                                address.Email,
                                getMember(address.MemberID).Name,
                                <AddressStatus key={key} address={address} />,
                                <AddressCatchAll key={key} address={address} domain={domain} />,
                                <AddressActions key={key} address={address} />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

AddressesTable.propTypes = {
    domain: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    members: PropTypes.array.isRequired
};

export default AddressesTable;
