import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableHeader, TableBody } from 'react-components';

import KeysRow from './KeysRow';
import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';

const KeysTable = ({
    email,
    keys,
    handleDeleteKey,
    handleExportKey,
    handleMakePrimaryKey,
    handleMarkObsoleteKey,
    handleMarkCompromisedKey
}) => {
    const list = keys.map(({ statuses, fingerprint, type }) => {
        const handleAction = (fn) => () => fn({ email, fingerprint });

        const keysActions = (
            <KeysActions
                handleDeleteKey={handleAction(handleDeleteKey)}
                handleExportKey={handleAction(handleExportKey)}
                handleMakePrimaryKey={handleAction(handleMakePrimaryKey)}
                handleMarkObsoleteKey={handleAction(handleMarkObsoleteKey)}
                handleMarkCompromisedKey={handleAction(handleMarkCompromisedKey)}
            />
        );

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
    email: PropTypes.string.isRequired,
    keys: PropTypes.array.isRequired,
    ...KeysActions.propTypes
};

export default KeysTable;
