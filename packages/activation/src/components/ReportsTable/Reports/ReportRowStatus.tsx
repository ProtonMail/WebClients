import { c } from 'ttag';

import { ApiImporterState, ApiReportRollbackState } from '@proton/activation/src/api/api.interface';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

interface Props {
    status: ApiImporterState;
    rollbackState: ApiReportRollbackState | undefined;
}

const ReportRowStatus = ({ status, rollbackState }: Props) => {
    if (rollbackState === ApiReportRollbackState.ROLLED_BACK || rollbackState === ApiReportRollbackState.ROLLING_BACK) {
        switch (rollbackState) {
            case ApiReportRollbackState.ROLLED_BACK:
                return (
                    <div className="inline-flex gap-2 color-success items-center">
                        <IcCheckmarkCircleFilled />
                        <span>{c('Import status').t`Undo finished`}</span>
                    </div>
                );
            case ApiReportRollbackState.ROLLING_BACK:
                return <span className="color-weak">{c('Import status').t`Undo in progress`}</span>;
        }
    }

    switch (status) {
        case ApiImporterState.PAUSED:
            return <span className="color-weak">{c('Import status').t`Paused`}</span>;
        case ApiImporterState.CANCELED:
            return <span className="color-weak">{c('Import status').t`Canceled`}</span>;
        case ApiImporterState.DONE:
            return (
                <div className="inline-flex gap-2 color-success items-center">
                    <IcCheckmarkCircleFilled />
                    <span>{c('Import status').t`Imported`}</span>
                </div>
            );
        case ApiImporterState.FAILED:
            return (
                <div className="inline-flex gap-2 color-danger items-center">
                    <IcExclamationCircleFilled />
                    <span>{c('Import status').t`Failed`}</span>
                </div>
            );
    }

    return null;
};

export default ReportRowStatus;
