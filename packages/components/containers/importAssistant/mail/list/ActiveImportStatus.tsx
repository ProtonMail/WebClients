import { c } from 'ttag';

import { Badge, Tooltip, Icon, Meter } from '../../../../components';

import { ImportMailStatus, ImportMailError } from '../interfaces';

interface Props {
    processed: number;
    total: number;
    state?: ImportMailStatus;
    errorCode?: ImportMailError;
}

const ActiveImportStatus = ({ processed, total, state, errorCode }: Props) => {
    const percentage = (processed * 100) / total;
    const percentageValue = Number.isNaN(percentage) ? 0 : Math.floor(percentage);

    switch (state) {
        case ImportMailStatus.PAUSED:
            return (
                <>
                    <Badge type="warning">{c('Import status').t`${percentageValue}% paused`}</Badge>

                    {errorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION && (
                        <Tooltip title={c('Tooltip').t`Account is disconnected`}>
                            <Icon name="triangle-exclamation-filled" />
                        </Tooltip>
                    )}
                    {errorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT && (
                        <Tooltip title={c('Tooltip').t`Your ProtonMail inbox is almost full`}>
                            <Icon name="triangle-exclamation-filled" />
                        </Tooltip>
                    )}
                </>
            );
        case ImportMailStatus.QUEUED:
            return <Badge type="primary">{c('Import status').t`Started`}</Badge>;
        case ImportMailStatus.CANCELED:
            return <Badge type="error">{c('Import status').t`Canceling`}</Badge>;
        case ImportMailStatus.DELAYED:
            return (
                <>
                    <Badge type="warning">{c('Import status').t`Delayed`}</Badge>
                    <Tooltip
                        title={c('Tooltip')
                            .t`Your external account may have reached its 24-hour bandwidth limit. Proton will try to resume the import as soon as possible.`}
                    >
                        <Icon name="triangle-exclamation-filled" />
                    </Tooltip>
                </>
            );
        default:
            return (
                <span className="inline-flex flex-align-items-center w100">
                    <Meter
                        aria-labelledby="meterLabel"
                        optimum={100}
                        value={percentageValue}
                        className="flex-item-fluid"
                    />
                    <span id="meterLabel" className="ml0-5">{`${percentageValue}%`}</span>
                </span>
            );
    }
};

export default ActiveImportStatus;
