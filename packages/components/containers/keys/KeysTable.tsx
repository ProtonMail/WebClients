import { format } from 'date-fns';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import useNotifications from '@proton/components/hooks/useNotifications';
import { dateLocale } from '@proton/shared/lib/i18n';

import Copy from '../../components/button/Copy';
import PersonalKeyWarningIcon from '../../components/icon/PersonalKeyWarningIcon';
import KeysActions from './KeysActions';
import KeysStatus, { getKeyFunction } from './KeysStatus';
import type { KeyActions, KeyDisplay } from './shared/interface';

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
    const { createNotification } = useNotifications();
    const headerCells = [
        { node: c('Title header for keys table').t`Creation date`, className: 'w-1/6' },
        { node: c('Title header for keys table').t`Type`, className: 'w-3/10' },
        { node: c('Title header for keys table').t`Fingerprint`, className: 'w-1/5 text-ellipsis' },
        { node: c('Title header for keys table').t`Function`, className: 'w-1/4' },
        { node: c('Title header for keys table').t`Status`, className: 'w-custom', style: { '--w-custom': '8.5em' } },
        { node: c('Title header for keys table').t`Actions`, className: 'w-custom', style: { '--w-custom': '13em' } },
    ].map(({ node, className = '', style }) => {
        return (
            <TableCell key={node} className={className} style={style} type="header">
                {node}
            </TableCell>
        );
    });

    // Keys are already sorted by the BE but need to be reordered
    // as we want the v6 primary key (if present) to appear before the v4 one
    const sortedKeys = keys[0]?.status.isPrimaryCompatibility ? [keys[1], keys[0], ...keys.slice(2)] : keys;

    return (
        <Table hasActions responsive="cards">
            <thead>
                <tr>{headerCells}</tr>
            </thead>
            <TableBody colSpan={5}>
                {sortedKeys.map(
                    ({ ID, creationDate, type, fingerprint, algorithm, status, permissions, invalidKeyError }) => {
                        const isInactiveKey = !status.isDecrypted;
                        const keyFunction = getKeyFunction(status);
                        return (
                            <TableRow
                                key={ID}
                                style={{ verticalAlign: 'baseline', color: isInactiveKey ? 'var(--text-hint)' : '' }}
                                labels={[
                                    c('Title header for keys table').t`Creation date`,
                                    c('Title header for keys table').t`Type`,
                                    c('Title header for keys table').t`Fingerprint`,
                                    c('Title header for keys table').t`Function`,
                                    c('Title header for keys table').t`Status`,
                                    c('Title header for keys table').t`Actions`,
                                ]}
                                cells={[
                                    format(creationDate, 'PP', { locale: dateLocale }),
                                    <div key={1} className="flex flex-row flex-nowrap items-center">
                                        {algorithm}
                                        {status.isWeak && (
                                            <PersonalKeyWarningIcon className="ml-2 hidden md:flex shrink-0" />
                                        )}
                                    </div>,
                                    <div key={2} className="flex flex-row flex-nowrap items-center">
                                        <code
                                            className="max-w-full inline-block text-ellipsis"
                                            data-testid="fingerprint"
                                            title={fingerprint}
                                            style={{ color: isInactiveKey ? 'var(--text-hint)' : 'var(--text-weak)' }}
                                        >
                                            {fingerprint}
                                        </code>
                                        <Copy
                                            size="small"
                                            value={fingerprint}
                                            className="shrink-0 ml-1 mr-2"
                                            shape="ghost"
                                            tooltipText={c('Label').t`Copy fingerprint`}
                                            onCopy={() => {
                                                createNotification({
                                                    text: c('Success').t`Fingerprint copied to clipboard`,
                                                });
                                            }}
                                        />
                                    </div>,
                                    keyFunction.tooltip ? (
                                        <Tooltip title={keyFunction.tooltip}>
                                            <span>{keyFunction.label}</span>
                                        </Tooltip>
                                    ) : (
                                        keyFunction.label
                                    ),
                                    <KeysStatus key={3} type={type} {...status} invalidKeyError={invalidKeyError} />,
                                    <KeysActions
                                        key={4}
                                        isLoading={status.isLoading}
                                        ID={ID}
                                        onDeleteKey={permissions.canDelete ? onDeleteKey : undefined}
                                        onExportPublicKey={
                                            permissions.canExportPublicKey ? onExportPublicKey : undefined
                                        }
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
                            />
                        );
                    }
                )}
            </TableBody>
        </Table>
    );
};

export default KeysTable;
