import { forwardRef } from 'react';

import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import upsellIconSvg from '@proton/styles/assets/img/illustrations/upsell-icon.svg';

const UpsellIcon = forwardRef<HTMLImageElement, React.HTMLProps<HTMLImageElement>>(({ ...imageElementProps }, ref) => (
    <img
        {...imageElementProps}
        ref={ref}
        src={upsellIconSvg}
        alt={c('Description').t`Available with ${MAIL_APP_NAME} Plus`}
        style={{ inlineSize: '2.8125rem' }}
    />
));
UpsellIcon.displayName = 'UpsellIcon';

export default UpsellIcon;
