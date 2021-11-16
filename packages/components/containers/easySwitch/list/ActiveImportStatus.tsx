import { c } from 'ttag';

import { ImportStatus, ImportError } from '@proton/shared/lib/interfaces/EasySwitch';

import { Badge, Tooltip, Icon, Progress } from '../../../components';

interface Props {
    processed: number;
    total: number;
    state?: ImportStatus;
    errorCode?: ImportError;
}

const ActiveImportStatus = ({ processed, total, state, errorCode }: Props) => {
    const percentage = total === 0 ? 0 : (processed * 100) / total;
    const percentageValue = Number.isNaN(percentage) ? 0 : Math.floor(percentage);

    switch (state) {
        case ImportStatus.PAUSED:
            return (
                <>
                    <Badge type="warning">{c('Import status').t`${percentageValue}% paused`}</Badge>

                    {errorCode === ImportError.ERROR_CODE_IMAP_CONNECTION && (
                        <Tooltip title={c('Tooltip').t`Account is disconnected`}>
                            <Icon name="triangle-exclamation-filled" />
                        </Tooltip>
                    )}
                    {errorCode === ImportError.ERROR_CODE_QUOTA_LIMIT && (
                        <Tooltip title={c('Tooltip').t`Your ProtonMail inbox is almost full`}>
                            <Icon name="triangle-exclamation-filled" />
                        </Tooltip>
                    )}
                </>
            );
        case ImportStatus.QUEUED:
            return <Badge type="primary">{c('Import status').t`Started`}</Badge>;
        case ImportStatus.CANCELED:
            return <Badge type="error">{c('Import status').t`Canceling`}</Badge>;
        case ImportStatus.DELAYED:
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
        /*
         * Default case is "in progress", if we have a total for the percentage
         * we can show a progress bar, otherwise just show "in progress"
         */
        default:
            return total !== 0 ? (
                <span className="inline-flex flex-align-items-center w100">
                    <Progress
                        aria-labelledby="progressLabel"
                        value={percentageValue}
                        className="flex-item-fluid progress-bar--success"
                    />
                    <span id="progressLabel" className="ml0-5">{`${percentageValue}%`}</span>
                </span>
            ) : (
                <Badge type="primary">{c('Import status').t`In progress`}</Badge>
            );
    }
};

export default ActiveImportStatus;
