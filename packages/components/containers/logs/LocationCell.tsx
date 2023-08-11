import { c } from 'ttag';

import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

interface Props {
    location: string | null;
    isProtonSentinelEnabled?: boolean;
    firstRow?: boolean;
}

const LocationCell = ({ location, isProtonSentinelEnabled, firstRow }: Props) => {
    const protonSentinelUpsell = c('Description').t`Enable ${PROTON_SENTINEL_NAME} to access these features`;

    if (isProtonSentinelEnabled) {
        return <span className="flex-item-fluid">{location || '-'}</span>;
    }

    if (firstRow) {
        return <span className="flex-item-fluid text-bold color-weak">{protonSentinelUpsell}</span>;
    }

    return null;
};

export default LocationCell;
