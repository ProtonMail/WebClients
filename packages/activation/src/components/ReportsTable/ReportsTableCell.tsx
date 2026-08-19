import { format } from 'date-fns';

import { TableCell } from '@proton/components';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { ApiImportProvider } from '../../api/api.interface';
import type { ImportType } from '../../interface';
import { getImportProductName } from './ReportsTableCell.helpers';
import { ReportsTableIcon } from './ReportsTableIcon';

interface Props {
    provider: ApiImportProvider;
    product: ImportType;
    title: string;
    importerDate?: number;
    isForwardingOnly?: boolean;
}

const ReportsTableCell = ({ product: app, title, provider, importerDate, isForwardingOnly }: Props) => (
    <TableCell>
        <div className="flex">
            <div className="shrink-0 mr-2 hidden md:flex">
                <ReportsTableIcon provider={provider} product={app} />
            </div>
            <div className="flex-1">
                <div className="w-full text-ellipsis" title={title}>
                    {title}
                </div>
                <div className="color-weak">
                    {getImportProductName(provider, app, isForwardingOnly)}
                    {!!importerDate && <time> - {format(importerDate * 1000, 'PPp', { locale: dateLocale })}</time>}
                </div>
            </div>
        </div>
    </TableCell>
);

export default ReportsTableCell;
