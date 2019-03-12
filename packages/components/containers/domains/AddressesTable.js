import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, TableHeader, TableBody, TableRow, Info } from 'react-components';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import AddressCatchAll from './AddressCatchAll';

const AddressesTable = ({ domain, members }) => {
    const getMemberName = (memberID) => {
        const { Name = '' } = members.data.find(({ ID }) => memberID === ID) || {};
        return Name;
    };
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
            <TableBody loading={members.loading} colSpan={5}>
                {domain.addresses.map((address, index) => {
                    const key = address.ID;
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                `${index + 1}.`,
                                address.Email,
                                getMemberName(address.MemberID),
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
    members: PropTypes.object.isRequired
};

const mapStateToProps = ({ members }) => ({ members });

export default connect(mapStateToProps)(AddressesTable);
