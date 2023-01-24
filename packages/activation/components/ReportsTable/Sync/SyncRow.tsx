import { format } from 'date-fns';

import { useEasySwitchSelector } from '@proton/activation/logic/store';
import { selectSyncById } from '@proton/activation/logic/sync/sync.selectors';
import { TableCell, TableRow } from '@proton/components/index';
import { dateLocale } from '@proton/shared/lib/i18n';

import ReportsTableCell from '../ReportsTableCell';
import SyncRowActions from './SyncRowActions';
import SyncRowStatus from './SyncRowStatus';

interface Props {
    syncId: string;
}

//TODO add date once the backend is ready
const SyncRow = ({ syncId }: Props) => {
    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const { product, account, state, startDate } = syncItem;

    return (
        <TableRow>
            <ReportsTableCell product={product} title={account} isSync />
            <TableCell>
                <div className="on-mobile-text-center">
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
