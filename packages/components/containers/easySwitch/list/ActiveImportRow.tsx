import { c } from 'ttag';
import { format } from 'date-fns';

import { ImportType, NormalizedImporter } from '@proton/shared/lib/interfaces/EasySwitch';

import { TableRow, Icon } from '../../../components';

import ActiveImportRowActions from './ActiveImportRowActions';
import ActiveImportStatus from './ActiveImportStatus';

interface Props {
    activeImport: NormalizedImporter;
}

const ActiveImportRow = ({ activeImport }: Props) => {
    const { Account, Product, Active } = activeImport;
    const { State, ErrorCode, CreateTime = Date.now(), Mapping = [] } = Active || {};

    const getProcessState = () => {
        if (Product === ImportType.MAIL) {
            return Mapping.reduce<{ total: number; processed: number }>(
                (acc, { Total = 0, Processed = 0 }) => {
                    acc.total += Total;
                    acc.processed += Processed;
                    return acc;
                },
                { total: 0, processed: 0 }
            );
        }

        if (Product === ImportType.CONTACTS) {
            return { total: Active.Total || 0, processed: Active.Processed || 0 };
        }

        return { total: 0, processed: 0 };
    };

    const { total, processed } = getProcessState();

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
        <div key={`import-${activeImport.ID}-row-email`} className="flex">
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
                    <time>{format(CreateTime * 1000, 'PPp')}</time>
                </div>
            </div>
        </div>,
        <div className="on-mobile-text-center" key={`import-${activeImport.ID}-row-status`}>
            <ActiveImportStatus processed={processed} total={total} state={State} errorCode={ErrorCode} />
        </div>,
        <time key={`import-${activeImport.ID}-row-data`}>{format(CreateTime * 1000, 'PPp')}</time>,
        '—',
        <ActiveImportRowActions key={`import-${activeImport.ID}-row-actions`} activeImport={activeImport} />,
    ];

    return <TableRow cells={cells} />;
};

export default ActiveImportRow;
