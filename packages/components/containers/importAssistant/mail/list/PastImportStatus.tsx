import { c } from 'ttag';

import { Badge } from '../../../../components';

import { ImportMailReportStatus } from '../interfaces';

interface Props {
    status: ImportMailReportStatus;
}

const PastImportStatus = ({ status }: Props) => {
    switch (status) {
        case ImportMailReportStatus.PAUSED:
            return <Badge type="warning" className="m0">{c('Import status').t`Paused`}</Badge>;
        case ImportMailReportStatus.CANCELED:
            return <Badge type="error" className="m0">{c('Import status').t`Canceled`}</Badge>;
        case ImportMailReportStatus.DONE:
            return <Badge type="success" className="m0">{c('Import status').t`Completed`}</Badge>;
        case ImportMailReportStatus.FAILED:
            return <Badge type="error" className="m0">{c('Import status').t`Failed`}</Badge>;
        default:
            return null;
    }
};

export default PastImportStatus;
