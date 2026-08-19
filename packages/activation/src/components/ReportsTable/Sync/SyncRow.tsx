import { TableCell, TableRow } from '@proton/components';

import { ApiImportProvider } from '../../../api/api.interface';
import { useEasySwitchSelector } from '../../../logic/store';
import { selectSyncById } from '../../../logic/sync/sync.selectors';
import ReportsTableCell from '../ReportsTableCell';
import SyncRowActions from './SyncRowActions';
import SyncRowStatus from './SyncRowStatus';

interface Props {
    syncId: string;
}

const SyncRow = ({ syncId }: Props) => {
    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const { product, account, state } = syncItem;

    return (
        <TableRow data-testid="reportsTable:syncRow">
            <ReportsTableCell provider={ApiImportProvider.GOOGLE} product={product} title={account} isForwardingOnly />
            <TableCell className="easy-switch-table-size">-</TableCell>
            <TableCell className="easy-switch-table-status">
                <SyncRowStatus state={state} />
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <SyncRowActions syncId={syncId} />
            </TableCell>
        </TableRow>
    );
};

export default SyncRow;
