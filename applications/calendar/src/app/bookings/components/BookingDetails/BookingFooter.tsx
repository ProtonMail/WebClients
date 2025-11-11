import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

export const BookingFooter = () => {
    const protonButton = (
        <ButtonLike key="bookly-footer-button" shape="underline" color="norm" as={Href} href={getStaticURL('')}>
            {BRAND_NAME}
        </ButtonLike>
    );

    return (
        <div className="mt-6 text-center">
            <p className="color-weak m-0">
                <span className="mr-2">{c('Info').jt`Powered by ${protonButton}`}</span>•
                <span className="ml-2">{c('Info').t`Privacy by default`}</span>
            </p>
        </div>
    );
};
