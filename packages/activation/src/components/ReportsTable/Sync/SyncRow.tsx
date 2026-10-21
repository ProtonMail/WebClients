import { memo } from 'react';

import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';

import { ApiImportProvider } from '../../../api/api.interface';
import type { Sync } from '../../../logic/sync/sync.interface';
import ReportsTableCell from '../ReportsTableCell';
import SyncRowActions from './SyncRowActions';
import SyncRowStatus from './SyncRowStatus';

interface Props {
    sync: Sync;
}

const SyncRow = ({ sync }: Props) => {
    const { product, account, state } = sync;

    return (
        <TableRow data-testid="reportsTable:syncRow">
            <ReportsTableCell provider={ApiImportProvider.GOOGLE} product={product} title={account} isForwardingOnly />
            <TableCell className="easy-switch-table-size">-</TableCell>
            <TableCell className="easy-switch-table-status">
                <SyncRowStatus state={state} />
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <SyncRowActions syncItem={sync} />
            </TableCell>
        </TableRow>
    );
};

export default memo(SyncRow);
