import React from 'react';
import { c } from 'ttag';
import { Copy, Table, TableCell, TableRow, TableBody } from '../../index';

import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';
import { KeyDisplay, KeyActions } from './shared/interface';

interface Props extends Partial<KeyActions> {
    keys: KeyDisplay[];
}
const KeysTable = ({
    keys = [],
    onDeleteKey,
    onSetPrimary,
    onExportPrivateKey,
    onExportPublicKey,
    onReactivateKey,
    onSetCompromised,
    onSetNotCompromised,
    onSetObsolete,
    onSetNotObsolete
}: Props) => {
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
        <Table className="pm-simple-table--has-actions">
            <thead>
                <tr>{headerCells}</tr>
            </thead>
            <TableBody colSpan={4}>
                {keys.map(({ ID, fingerprint, algorithm, status, permissions }) => {
                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key={1} className="flex flex-row flex-nowrap flex-items-center">
                                    <Copy value={fingerprint} className="pm-button--small" />
                                    <code className="ml1 mw100 inbl ellipsis" title={fingerprint}>
                                        {fingerprint}
                                    </code>
                                </div>,
                                algorithm,
                                <KeysStatus key={2} {...status} />,
                                <KeysActions
                                    key={3}
                                    isLoading={status.isLoading}
                                    ID={ID}
                                    onReactivateKey={permissions.canReactivate ? onReactivateKey : undefined}
                                    onDeleteKey={permissions.canDelete ? onDeleteKey : undefined}
                                    onExportPublicKey={permissions.canExportPublicKey ? onExportPublicKey : undefined}
                                    onExportPrivateKey={
                                        permissions.canExportPrivateKey ? onExportPrivateKey : undefined
                                    }
                                    onSetPrimary={permissions.canSetPrimary ? onSetPrimary : undefined}
                                    onSetCompromised={permissions.canSetCompromised ? onSetCompromised : undefined}
                                    onSetNotCompromised={
                                        permissions.canSetNotCompromised ? onSetNotCompromised : undefined
                                    }
                                    onSetObsolete={permissions.canSetObsolete ? onSetObsolete : undefined}
                                    onSetNotObsolete={permissions.canSetNotObsolete ? onSetNotObsolete : undefined}
                                />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default KeysTable;
