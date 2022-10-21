import { c } from 'ttag';

import { ImportReportRollbackState, ImportStatus } from '@proton/shared/lib/interfaces/EasySwitch';

import { Badge } from '../../../components';

interface Props {
    status: ImportStatus;
    rollbackState: ImportReportRollbackState | undefined;
}

const ImportReportStatus = ({ status, rollbackState }: Props) => {
    if (
        rollbackState === ImportReportRollbackState.ROLLED_BACK ||
        rollbackState === ImportReportRollbackState.ROLLING_BACK
    ) {
        switch (rollbackState) {
            case ImportReportRollbackState.ROLLED_BACK:
                return <Badge type="success" className="m0">{c('Import rollback status').t`Undo finished`}</Badge>;
            case ImportReportRollbackState.ROLLING_BACK:
                return <Badge type="warning" className="m0">{c('Import rollback status').t`Undo in progress`}</Badge>;
        }
    }

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
