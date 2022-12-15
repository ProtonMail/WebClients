import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import ProtonBadge from './ProtonBadge';

interface Props {
    selected?: boolean;
}

const VerifiedBadge = ({ selected }: Props) => {
    return (
        <ProtonBadge
            text={c('Info').t`Official`}
            tooltipText={c('Info').t`Verified ${BRAND_NAME} message`}
            selected={selected}
        />
    );
};

export default VerifiedBadge;
