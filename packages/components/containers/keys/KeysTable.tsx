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
        { node: c('Title header for keys table').t`Key type`, className: 'w-1/6' },
        { node: c('Title header for keys table').t`Status`, className: 'w-custom', style: { '--w-custom': '8em' } },
        { node: c('Title header for keys table').t`Actions`, className: 'w-custom', style: { '--w-custom': '13em' } },
    ].map(({ node, className = '' }) => {
        return (
            <TableCell key={node} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <Table hasActions responsive="cards">
            <thead>
                <tr>{headerCells}</tr>
            </thead>
            <TableBody colSpan={4}>
                {keys.map(({ ID, type, fingerprint, algorithm, status, permissions }) => {
                    return (
                        <TableRow
                            key={ID}
                            labels={[
                                c('Title header for keys table').t`Fingerprint`,
                                c('Title header for keys table').t`Key type`,
                                '',
                                '',
                            ]}
                            cells={[
                                <div key={1} className="flex flex-row flex-nowrap flex-align-items-center">
                                    <Copy
                                        size="small"
                                        value={fingerprint}
                                        className="flex-item-noshrink mr-2 md:mr-4"
                                    />
                                    <code
                                        className="max-w-full inline-block text-ellipsis"
                                        data-testid="fingerprint"
                                        title={fingerprint}
                                    >
                                        {fingerprint}
                                    </code>
                                    {status.isWeak && (
                                        <PersonalKeyWarningIcon className="ml-auto hidden md:flex flex-item-noshrink" />
                                    )}
                                </div>,
                                algorithm,
                                <KeysStatus key={2} type={type} {...status} />,
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
                            className="xon-mobile-hide-td2 xon-tiny-mobile-hide-td3"
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default KeysTable;
