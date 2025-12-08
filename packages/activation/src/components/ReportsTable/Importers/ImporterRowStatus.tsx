import { c } from 'ttag';

import { ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Badge } from '@proton/components';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    state: ApiImporterState | undefined;
    errorCode: ApiImporterError | undefined;
}

const ImporterRowStatus = ({ state, errorCode }: Props) => {
    switch (state) {
        case ApiImporterState.PAUSED:
            return (
                <>
                    <Badge type="warning">{c('Import status').t`Paused`}</Badge>

                    {errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION && (
                        <Tooltip
                            title={c('Tooltip').t`Account is disconnected`}
                            data-testid="ImporterRowStatus:IMAP_Error"
                        >
                            <IcExclamationCircleFilled />
                        </Tooltip>
                    )}
                    {errorCode === ApiImporterError.ERROR_CODE_QUOTA_LIMIT && (
                        <Tooltip
                            title={c('Tooltip').t`Your ${MAIL_APP_NAME} inbox is almost full`}
                            data-testid="ImporterRowStatus:quota_Error"
                        >
                            <IcExclamationCircleFilled />
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
                        <IcExclamationCircleFilled />
                    </Tooltip>
                </>
            );
        /*
         * Default case is "in progress"
         */
        default:
            return <Badge type="primary">{c('Import status').t`In progress`}</Badge>;
    }
};

export default ImporterRowStatus;
