import { ImportType } from '@proton/activation/interface';
import { Icon, TableCell } from '@proton/components/components';

import { getImportIconNameByProduct, getImportProductName } from './ReportsTableCell.helpers';

interface Props {
    product: ImportType;
    title: string;
    isSync?: boolean;
}

const ReportsTableCell = ({ product: app, title, isSync }: Props) => (
    <TableCell>
        <div className="flex">
            <div className="flex-item-noshrink mr0-5 no-mobile">
                <Icon name={getImportIconNameByProduct(app, isSync)} className="color-weak" />
            </div>
            <div className="flex-item-fluid">
                <div className="w100 text-ellipsis" title={title}>
                    {title}
                </div>
                <div className="flex color-weak">{getImportProductName(app)}</div>
            </div>
        </div>
    </TableCell>
);

export default ReportsTableCell;
