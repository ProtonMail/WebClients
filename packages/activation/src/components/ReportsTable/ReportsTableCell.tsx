import { format } from 'date-fns';

import type { ApiImportProvider } from '@proton/activation/src/api/api.interface';
import { ReportsTableIcon } from '@proton/activation/src/components/ReportsTable/ReportsTableIcon';
import type { ImportType } from '@proton/activation/src/interface';
import { TableCell } from '@proton/components';
import { dateLocale } from '@proton/shared/lib/i18n';

import { getImportProductName } from './ReportsTableCell.helpers';

interface Props {
    provider: ApiImportProvider;
    product: ImportType;
    title: string;
    importerDate?: number;
}

const ReportsTableCell = ({ product: app, title, provider, importerDate }: Props) => (
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
                    {getImportProductName(provider, app)}
                    {!!importerDate && <time> - {format(importerDate * 1000, 'PPp', { locale: dateLocale })}</time>}
                </div>
            </div>
        </div>
    </TableCell>
);

export default ReportsTableCell;
