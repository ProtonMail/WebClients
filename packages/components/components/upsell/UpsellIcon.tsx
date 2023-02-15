import { forwardRef } from 'react';

import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import upsellIconSvg from '@proton/styles/assets/img/illustrations/upsell-icon.svg';

const UpsellIcon = forwardRef<HTMLImageElement, React.HTMLProps<HTMLImageElement>>(({ ...imageElementProps }, ref) => (
    <img
        {...imageElementProps}
        ref={ref}
        src={upsellIconSvg}
        alt={c('Description').t`Upsell icon containing ${BRAND_NAME} logo followed by a plus sign`}
    />
));
UpsellIcon.displayName = 'UpsellIcon';

export default UpsellIcon;
