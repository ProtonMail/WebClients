import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { ApiImporterError, ApiImporterState } from '../../../api/api.interface';
import { getImporterString } from '../Reports/reportStrings';

interface Props {
    state: ApiImporterState | undefined;
    errorCode: ApiImporterError | undefined;
}

const ImporterRowStatus = ({ state, errorCode }: Props) => {
    if (state === ApiImporterState.PAUSED) {
        return (
            <div className="inline-flex gap-2 color-weak items-center">
                <span>{getImporterString(state)}</span>
                {errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION && (
                    <Tooltip title={c('Tooltip').t`Account is disconnected`} data-testid="ImporterRowStatus:IMAP_Error">
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
    }

    if (state === ApiImporterState.CANCELED) {
        return <span className="color-weak">{getImporterString(state)}</span>;
    }

    if (state === ApiImporterState.DELAYED) {
        return (
            <div className="inline-flex gap-2 color-weak items-center">
                <span>{getImporterString(state)}</span>
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
    }

    // Any other state is displayed as in progress
    return <span className="color-weak">{getImporterString(ApiImporterState.RUNNING)}</span>;
};

export default ImporterRowStatus;
