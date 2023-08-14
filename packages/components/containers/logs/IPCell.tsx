import { c } from 'ttag';

import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

interface Props {
    ip: string;
    isAuthLogAdvanced?: boolean;
    isProtonSentinelEnabled?: boolean;
    firstRow?: boolean;
}

const IPCell = ({ ip, isAuthLogAdvanced, isProtonSentinelEnabled, firstRow }: Props) => {
    const advancedLogsUpsell = c('Description').t`Enable advanced logs to access these features`;
    const advancedLogsAndProtonSentinelUpsell = c('Description')
        .t`Enable advanced logs and ${PROTON_SENTINEL_NAME} to access these features`;

    if (isAuthLogAdvanced) {
        return <code>{ip || '-'}</code>;
    }

    if (firstRow) {
        return (
            <span className="flex-item-fluid text-bold color-weak">
                {!isProtonSentinelEnabled && !isAuthLogAdvanced
                    ? advancedLogsAndProtonSentinelUpsell
                    : advancedLogsUpsell}
            </span>
        );
    }

    return null;
};

export default IPCell;
