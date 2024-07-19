import { c } from 'ttag';

import type { Props as BadgeProps } from './Badge';
import Badge from './Badge';

const BetaBadge = (props: Omit<BadgeProps, 'type' | 'children' | 'tooltip'>) => {
    const tooltip = c('Tooltip').t`This feature is only available on Beta`;
    return (
        <Badge type="origin" tooltip={tooltip} {...props}>{c('Label to  inform a feature is only available on Beta')
            .t`Beta`}</Badge>
    );
};

export default BetaBadge;
