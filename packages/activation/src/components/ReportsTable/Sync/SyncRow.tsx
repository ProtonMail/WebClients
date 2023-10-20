import { format } from 'date-fns';

import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { selectSyncById } from '@proton/activation/src/logic/sync/sync.selectors';
import { TableCell, TableRow } from '@proton/components';
import { dateLocale } from '@proton/shared/lib/i18n';

import ReportsTableCell from '../ReportsTableCell';
import SyncRowActions from './SyncRowActions';
import SyncRowStatus from './SyncRowStatus';

interface Props {
    syncId: string;
}

const SyncRow = ({ syncId }: Props) => {
    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const { product, account, state, startDate } = syncItem;

    return (
        <TableRow data-testid="reportsTable:syncRow">
            <ReportsTableCell product={product} title={account} isSync />
            <TableCell>
                <div className="text-center md:text-left">
                    <SyncRowStatus state={state} />
                </div>
            </TableCell>
            <TableCell>
                <time>{format(startDate * 1000, 'PPp', { locale: dateLocale })}</time>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>
                <SyncRowActions syncId={syncId} />
            </TableCell>
        </TableRow>
    );
};

export default SyncRow;
