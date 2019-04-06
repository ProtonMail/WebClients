import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableHeader, TableBody } from 'react-components';

import KeysRow from './KeysRow';
import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';

const KeysTable = ({ keys = [] }) => {
    const list = keys.map(({ actions, statuses, fingerprint, type }) => {
        const keysActions = <KeysActions actions={actions} />;
        const keysStatus = <KeysStatus statuses={statuses} />;

        return (
            <KeysRow
                key={fingerprint}
                fingerprint={fingerprint}
                type={type}
                status={keysStatus}
                actions={keysActions}
            />
        );
    });

    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for keys table').t`Fingerprint`,
                    c('Title header for keys table').t`Key type`,
                    c('Title header for keys table').t`Status`,
                    c('Title header for keys table').t`Actions`
                ]}
            />
            <TableBody>{list}</TableBody>
        </Table>
    );
};

KeysTable.propTypes = {
    keys: PropTypes.array.isRequired
};

export default KeysTable;
