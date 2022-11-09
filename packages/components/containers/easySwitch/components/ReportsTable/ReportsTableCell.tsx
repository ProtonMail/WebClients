import format from 'date-fns/format';

import { Icon, TableCell } from '@proton/components/components';

import { ImportType } from '../../logic/types/shared.types';
import { getImportIconNameByProduct, getImportProductName } from './ReportsTableCell.helpers';

interface Props {
    product: ImportType;
    date: number;
    title: string;
}

const DashboardTableImportCell = ({ product: app, date, title }: Props) => (
    <TableCell>
        <div className="flex">
            <div className="flex-item-noshrink mr0-5 no-mobile">
                <Icon name={getImportIconNameByProduct(app)} className="color-weak" />
            </div>
            <div className="flex-item-fluid">
                <div className="w100 text-ellipsis" title={title}>
                    {title}
                </div>
                <div className="flex color-weak">
                    <Icon
                        name={getImportIconNameByProduct(app)}
                        className="flex-align-self-center mr0-5 no-desktop no-tablet"
                    />
                    {getImportProductName(app)}
                </div>
                <div className="no-desktop no-tablet">
                    <time>{format(date * 1000, 'PPp')}</time>
                </div>
            </div>
        </div>
    </TableCell>
);

export default DashboardTableImportCell;
