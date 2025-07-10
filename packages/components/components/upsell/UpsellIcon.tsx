import { forwardRef } from 'react';

import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import upsellIconSvg from '@proton/styles/assets/img/illustrations/upsell-icon.svg';

const UpsellIcon = forwardRef<HTMLImageElement, React.HTMLProps<HTMLImageElement>>(({ ...imageElementProps }, ref) => {
    const title = PLAN_NAMES[PLANS.MAIL];
    return (
        <img
            {...imageElementProps}
            ref={ref}
            src={upsellIconSvg}
            alt={c('Description').t`Available with ${title}`}
            style={{ inlineSize: '2.8125rem' }}
        />
    );
});
UpsellIcon.displayName = 'UpsellIcon';

export default UpsellIcon;
