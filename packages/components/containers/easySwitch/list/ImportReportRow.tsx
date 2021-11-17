import { c } from 'ttag';
import { format } from 'date-fns';

import { ImportType, ImportReport } from '@proton/shared/lib/interfaces/EasySwitch';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { TableRow, Icon } from '../../../components';

import ImportReportStatus from './ImportReportStatus';
import ImportReportRowActions from './ImportReportRowActions';

interface Props {
    report: ImportReport;
}

const ImportReportRow = ({ report }: Props) => {
    const { ID, Account, Product } = report;

    const { EndTime, TotalSize, State: ReportStatus } = report;

    const importType = () => {
        switch (Product) {
            case ImportType.MAIL:
                return c('Import type').t`Mail`;
            case ImportType.CALENDAR:
                return c('Import type').t`Calendar`;
            case ImportType.CONTACTS:
                return c('Import type').t`Contacts`;
            default:
                return null;
        }
    };
    const importTypeIcon = () => {
        switch (Product) {
            case ImportType.MAIL:
                return 'envelope';
            case ImportType.CALENDAR:
                return 'calendar-days';
            case ImportType.CONTACTS:
                return 'user-group';
            default:
                return '';
        }
    };

    const cells = [
        <div key="email" className="flex">
            <div className="flex-item-noshrink mr0-5 no-mobile">
                <Icon name={importTypeIcon()} className="color-weak" />
            </div>
            <div className="flex-item-fluid">
                <div className="w100 text-ellipsis" title={Account}>
                    {Account}
                </div>
                <div className="flex color-weak">
                    <Icon name={importTypeIcon()} className="flex-align-self-center mr0-5 no-desktop no-tablet" />
                    {importType()}
                </div>
                <div className="no-desktop no-tablet">
                    <time>{format(EndTime * 1000, 'PPp')}</time>
                </div>
            </div>
        </div>,
        <div className="on-mobile-text-center" key="status">
            <ImportReportStatus status={ReportStatus} />
        </div>,
        <time key="importDate">{format(EndTime * 1000, 'PPp')}</time>,
        humanSize(TotalSize),
        <ImportReportRowActions key="button" ID={ID} importType={Product} />,
    ];

    return <TableRow cells={cells} />;
};

export default ImportReportRow;
