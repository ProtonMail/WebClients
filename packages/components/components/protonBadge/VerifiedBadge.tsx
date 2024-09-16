import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import ProtonBadge from './ProtonBadge';

interface Props {
    selected?: boolean;
}

const VerifiedBadge = ({ selected }: Props) => {
    return (
        <ProtonBadge
            text={c('protonbadge').t`Official`}
            tooltipText={c('protonbadge').t`Official email from ${BRAND_NAME}`}
            selected={selected}
        />
    );
};

export default VerifiedBadge;
