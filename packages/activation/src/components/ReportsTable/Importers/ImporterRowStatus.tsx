import { c } from 'ttag';

import { ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    state: ApiImporterState | undefined;
    errorCode: ApiImporterError | undefined;
}

const ImporterRowStatus = ({ state, errorCode }: Props) => {
    switch (state) {
        case ApiImporterState.PAUSED:
            return (
                <div className="inline-flex gap-2 color-weak items-center">
                    <span>{c('Import status').t`Paused`}</span>
                    {errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION && (
                        <Tooltip
                            title={c('Tooltip').t`Account is disconnected`}
                            data-testid="ImporterRowStatus:IMAP_Error"
                        >
                            <span className="inline-flex ">
                                <IcInfoCircle />
                            </span>
                        </Tooltip>
                    )}
                    {errorCode === ApiImporterError.ERROR_CODE_QUOTA_LIMIT && (
                        <Tooltip
                            title={c('Tooltip').t`Your ${MAIL_APP_NAME} inbox is almost full`}
                            data-testid="ImporterRowStatus:quota_Error"
                        >
                            <span className="inline-flex ">
                                <IcInfoCircle />
                            </span>
                        </Tooltip>
                    )}
                </div>
            );
        case ApiImporterState.CANCELED:
            return <span className="color-weak">{c('Import status').t`Canceling...`}</span>;
        case ApiImporterState.DELAYED:
            return (
                <div className="inline-flex gap-2 color-weak items-center">
                    <span>{c('Import status').t`Delayed`}</span>
                    <Tooltip
                        title={c('Tooltip')
                            .t`Your external account may have reached its 24-hour bandwidth limit. ${BRAND_NAME} will try to resume the import as soon as possible.`}
                    >
                        <span className="inline-flex">
                            <IcInfoCircle />
                        </span>
                    </Tooltip>
                </div>
            );

        /*
         * Default case is "in progress"
         */
        default:
            return <span className="color-weak">{c('Import status').t`In progress...`}</span>;
    }
};

export default ImporterRowStatus;
