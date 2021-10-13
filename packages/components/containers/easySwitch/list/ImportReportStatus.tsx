import { c } from 'ttag';

import { ImportStatus } from '@proton/shared/lib/interfaces/EasySwitch';

import { Badge } from '../../../components';

interface Props {
    status: ImportStatus;
}

const ImportReportStatus = ({ status }: Props) => {
    switch (status) {
        case ImportStatus.PAUSED:
            return <Badge type="warning" className="m0">{c('Import status').t`Paused`}</Badge>;
        case ImportStatus.CANCELED:
            return <Badge type="error" className="m0">{c('Import status').t`Canceled`}</Badge>;
        case ImportStatus.DONE:
            return <Badge type="success" className="m0">{c('Import status').t`Completed`}</Badge>;
        case ImportStatus.FAILED:
            return <Badge type="error" className="m0">{c('Import status').t`Failed`}</Badge>;
        default:
            return null;
    }
};

export default ImportReportStatus;
