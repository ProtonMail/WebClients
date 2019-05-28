import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableCell, TableRow, TableBody } from 'react-components';

import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';

const KeysTable = ({ keys, onAction }) => {
    const headerCells = [
        { node: c('Title header for keys table').t`Fingerprint`, className: 'w50' },
        { node: c('Title header for keys table').t`Key type` },
        { node: c('Title header for keys table').t`Status` },
        { node: c('Title header for keys table').t`Actions` }
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <Table>
            <thead>
                <tr>{headerCells}</tr>
            </thead>
            <TableBody colSpan={4}>
                {keys.map(({ ID, fingerprint, algorithm, isLoading, ...rest }, idx) => {
                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <code key={1} className="mw100 inbl ellipsis">
                                    {fingerprint}
                                </code>,
                                algorithm,
                                <KeysStatus key={2} {...rest} />,
                                <KeysActions
                                    key={3}
                                    loading={isLoading}
                                    onAction={(action) => onAction(action, ID, idx)}
                                    {...rest}
                                />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

KeysTable.propTypes = {
    keys: PropTypes.array,
    onAction: PropTypes.func.isRequired,
    loadingKeyID: PropTypes.bool
};

KeysTable.defaultProps = {
    keys: []
};

export default KeysTable;
