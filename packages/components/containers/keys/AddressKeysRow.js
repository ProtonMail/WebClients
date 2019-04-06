import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { TableRow, TableCell } from 'react-components';

const AddressKeysRow = ({ email, fingerprint, type, children }) => {
    const [expanded, setExpanded] = useState(false);

    const AddressKeysEmail = () => {
        const handleOnClick = () => setExpanded(!expanded);

        return (
            <div onClick={handleOnClick} className={expanded ? 'bold' : ''}>
                {expanded ? 'x ' : '> '}
                {email}
            </div>
        );
    };

    return (
        <>
            <TableRow cells={[<AddressKeysEmail key={0} />, fingerprint, type]} />
            {expanded ? (
                <tr>
                    <TableCell colSpan={3}>{children}</TableCell>
                </tr>
            ) : null}
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
