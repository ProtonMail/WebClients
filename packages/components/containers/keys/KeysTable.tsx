import { c } from 'ttag';

import Copy from '../../components/button/Copy';
import PersonalKeyWarningIcon from '../../components/icon/PersonalKeyWarningIcon';
import { Table, TableBody, TableCell, TableRow } from '../../components/table';
import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';
import { KeyActions, KeyDisplay } from './shared/interface';

interface Props extends Partial<KeyActions> {
    keys: KeyDisplay[];
}
const KeysTable = ({
    keys = [],
    onDeleteKey,
    onSetPrimary,
    onExportPrivateKey,
    onExportPublicKey,
    onSetCompromised,
    onSetNotCompromised,
    onSetObsolete,
    onSetNotObsolete,
}: Props) => {
    const headerCells = [
        { node: c('Title header for keys table').t`Fingerprint`, className: 'text-ellipsis' },
        { node: c('Title header for keys table').t`Key type`, className: 'w15 no-mobile' },
        { node: c('Title header for keys table').t`Status`, className: 'w10e no-tiny-mobile' },
        { node: c('Title header for keys table').t`Actions`, className: 'w10e' },
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <Table className="simple-table--has-actions">
            <thead>
                <tr>{headerCells}</tr>
            </thead>
            <TableBody colSpan={4}>
                {keys.map(({ ID, fingerprint, algorithm, status, permissions, isWeak }) => {
                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key={1} className="flex flex-row flex-nowrap flex-align-items-center">
                                    <Copy
                                        size="small"
                                        value={fingerprint}
                                        className="flex-item-noshrink no-tiny-mobile mr1 on-mobile-mr0-5 on-tiny-mobile-m0"
                                    />
                                    <code className="max-w100 inline-block text-ellipsis" title={fingerprint}>
                                        {fingerprint}
                                    </code>
                                    <PersonalKeyWarningIcon
                                        isWeak={isWeak}
                                        className="mlauto no-mobile flex-item-noshrink"
                                    />
                                </div>,
                                algorithm,
                                <KeysStatus key={2} {...status} />,
                                <KeysActions
                                    key={3}
                                    isLoading={status.isLoading}
                                    ID={ID}
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
                                />,
                            ]}
                            className="on-mobile-hide-td2 on-tiny-mobile-hide-td3"
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default KeysTable;
