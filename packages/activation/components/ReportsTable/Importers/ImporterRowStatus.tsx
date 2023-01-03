import { c } from 'ttag';

import { ApiImporterError, ApiImporterState } from '@proton/activation/api/api.interface';
import { Badge, Icon, Progress, Tooltip } from '@proton/components';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    processed: number;
    total: number;
    state: ApiImporterState | undefined;
    errorCode: ApiImporterError | undefined;
}

const ImporterRowStatus = ({ processed, total, state, errorCode }: Props) => {
    const percentage = total === 0 ? 0 : (processed * 100) / total;
    const percentageValue = Number.isNaN(percentage) ? 0 : Math.floor(percentage);

    switch (state) {
        case ApiImporterState.PAUSED:
            return (
                <>
                    <Badge type="warning">
                        {total === 0 ? c('Import status').t`Paused` : c('Import status').t`${percentageValue}% paused`}
                    </Badge>

                    {errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION && (
                        <Tooltip title={c('Tooltip').t`Account is disconnected`}>
                            <Icon name="exclamation-circle-filled" />
                        </Tooltip>
                    )}
                    {errorCode === ApiImporterError.ERROR_CODE_QUOTA_LIMIT && (
                        <Tooltip title={c('Tooltip').t`Your ${MAIL_APP_NAME} inbox is almost full`}>
                            <Icon name="exclamation-circle-filled" />
                        </Tooltip>
                    )}
                </>
            );
        case ApiImporterState.QUEUED:
            return <Badge type="primary">{c('Import status').t`Started`}</Badge>;
        case ApiImporterState.CANCELED:
            return <Badge type="error">{c('Import status').t`Canceling`}</Badge>;
        case ApiImporterState.DELAYED:
            return (
                <>
                    <Badge type="warning">{c('Import status').t`Delayed`}</Badge>
                    <Tooltip
                        title={c('Tooltip')
                            .t`Your external account may have reached its 24-hour bandwidth limit. ${BRAND_NAME} will try to resume the import as soon as possible.`}
                    >
                        <Icon name="exclamation-circle-filled" />
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

export default ImporterRowStatus;
