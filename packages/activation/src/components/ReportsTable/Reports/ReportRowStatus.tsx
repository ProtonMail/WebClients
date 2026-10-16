import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

import { ApiImporterState, ApiReportRollbackState } from '../../../api/api.interface';
import { getReportString, getRollbackStateString } from './reportStrings';

interface Props {
    status: ApiImporterState;
    rollbackState: ApiReportRollbackState | undefined;
}

const ReportRowStatus = ({ status, rollbackState }: Props) => {
    if (rollbackState === ApiReportRollbackState.ROLLED_BACK) {
        const rollbackString = getRollbackStateString(rollbackState);
        return (
            <div className="inline-flex gap-2 color-success items-center">
                <IcCheckmarkCircleFilled />
                <span>{rollbackString}</span>
            </div>
        );
    }

    if (rollbackState === ApiReportRollbackState.ROLLING_BACK) {
        const rollbackString = getRollbackStateString(rollbackState);
        return <span className="color-weak">{rollbackString}</span>;
    }

    const statusString = getReportString(status);
    if (status === ApiImporterState.PAUSED || status === ApiImporterState.CANCELED) {
        return <span className="color-weak">{statusString}</span>;
    }

    if (status === ApiImporterState.DONE || status === ApiImporterState.FAILED) {
        const icon = status === ApiImporterState.DONE ? <IcCheckmarkCircleFilled /> : <IcExclamationCircleFilled />;
        const colorClass = status === ApiImporterState.DONE ? 'color-success' : 'color-danger';
        return (
            <div className={`inline-flex gap-2 ${colorClass} items-center`}>
                {icon}
                <span>{statusString}</span>
            </div>
        );
    }

    return null;
};

export default ReportRowStatus;
