import { c } from 'ttag';

import { Badge } from '@proton/components';

import { ApiImporterState, ApiReportRollbackState } from '../../../logic/types/api.types';

interface Props {
    status: ApiImporterState;
    rollbackState: ApiReportRollbackState | undefined;
}

const ReportRowStatus = ({ status, rollbackState }: Props) => {
    if (rollbackState === ApiReportRollbackState.ROLLED_BACK || rollbackState === ApiReportRollbackState.ROLLING_BACK) {
        switch (rollbackState) {
            case ApiReportRollbackState.ROLLED_BACK:
                return <Badge type="success" className="m0">{c('Import rollback status').t`Undo finished`}</Badge>;
            case ApiReportRollbackState.ROLLING_BACK:
                return <Badge type="warning" className="m0">{c('Import rollback status').t`Undo in progress`}</Badge>;
        }
    }

    switch (status) {
        case ApiImporterState.PAUSED:
            return <Badge type="warning" className="m0">{c('Import status').t`Paused`}</Badge>;
        case ApiImporterState.CANCELED:
            return <Badge type="error" className="m0">{c('Import status').t`Canceled`}</Badge>;
        case ApiImporterState.DONE:
            return <Badge type="success" className="m0">{c('Import status').t`Completed`}</Badge>;
        case ApiImporterState.FAILED:
            return <Badge type="error" className="m0">{c('Import status').t`Failed`}</Badge>;
    }

    return null;
};

export default ReportRowStatus;
