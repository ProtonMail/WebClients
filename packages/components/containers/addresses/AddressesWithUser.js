import React, { useMemo } from 'react';
import { c } from 'ttag';
import { useAddresses, Alert, Table, TableHeader, TableBody, TableRow } from 'react-components';
import PropTypes from 'prop-types';

import AddressStatus from './AddressStatus';
import AddressActions from './AddressActions';
import { getStatus } from './helper';

const AddressesUser = ({ user }) => {
    const [addresses, loadingAddresses] = useAddresses();
    const member = useMemo(() => ({ Self: 1 }), []);

    if (!loadingAddresses && !addresses.length) {
        return (
            <>
                <Alert>{c('Info').t`No addresses exist`}</Alert>
            </>
        );
    }

    return (
        <Table>
            <TableHeader
                cells={[
                    c('Header for addresses table').t`Address`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`
                ]}
            />
            <TableBody colSpan={3} loading={loadingAddresses}>
                {addresses &&
                    addresses.map((address, i) => (
                        <TableRow
                            key={address.ID}
                            cells={[
                                address.Email,
                                <AddressStatus key={1} {...getStatus({ address, i })} />,
                                <AddressActions key={2} member={member} address={address} user={user} />
                            ]}
                        />
                    ))}
            </TableBody>
        </Table>
    );
};

AddressesUser.propTypes = {
    user: PropTypes.object.isRequired
};

export default AddressesUser;
