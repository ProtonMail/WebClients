import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

interface Props {
    ip: string;
    isAuthLogAdvanced?: boolean;
    isProtonSentinelEnabled?: boolean;
    firstRow?: boolean;
}

const IPCell = ({ ip, isAuthLogAdvanced, isProtonSentinelEnabled, firstRow }: Props) => {
    const [user] = useUser();
    const advancedLogsUpsell = user.isFree || user.isAdmin
        ? c('Description').t`You should enable detailed events in order to access these features`
        : c('Description')
              .t`Your organization administrator should enable detailed events in order to access these features`;
    const advancedLogsAndProtonSentinelUpsell = user.isFree || user.isAdmin
        ? c('Description')
              .t`You should enable detailed events and ${PROTON_SENTINEL_NAME} in order to access these features`
        : c('Description')
              .t`Your organization administrator should enable detailed events and ${PROTON_SENTINEL_NAME} in order to access these features`;

    if (isAuthLogAdvanced || user.isAdmin) {
        return <code>{ip || '-'}</code>;
    }

    if (firstRow) {
        return (
            <span className="flex-1 text-bold color-weak">
                {!isProtonSentinelEnabled && !isAuthLogAdvanced
                    ? advancedLogsAndProtonSentinelUpsell
                    : advancedLogsUpsell}
            </span>
        );
    }

    return null;
};

export default IPCell;
