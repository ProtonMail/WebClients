import PropTypes from 'prop-types';
import React from 'react';
import { TableRow, TableCell } from 'react-components';

const AddressKeysRow = ({ email, fingerprint, type, children }) => {
    return (
        <>
            <TableRow cells={[email, fingerprint, type]} />
            <tr>
                <TableCell colSpan={3}>{children}</TableCell>
            </tr>
        </>
    );
};

AddressKeysRow.propTypes = {
    email: PropTypes.string.isRequired,
    fingerprint: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

export default AddressKeysRow;
