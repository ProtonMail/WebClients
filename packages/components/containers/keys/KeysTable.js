import React from 'react';
import { c } from 'ttag';
import { Table, TableHeader } from 'react-components';

const KeysTable = () => {
    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for keys table').t`Email`,
                    c('Title header for keys table').t`Fingerprint`,
                    c('Title header for keys table').t`Key type`
                ]}
            />
        </Table>
    );
};

KeysTable.propTypes = {};

export default KeysTable;
