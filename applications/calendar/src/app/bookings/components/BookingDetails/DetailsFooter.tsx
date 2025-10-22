import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

export const DetailsFooter = () => {
    return (
        <div className="mt-6 text-center">
            <p className="color-weak m-0">{c('Info').t`Want to create your own booking page?`}</p>
            <ButtonLike as={Href} href="/signup" target="_self" shape="underline" color="norm" className="p-0">{c(
                'Action'
            ).t`Join ${CALENDAR_APP_NAME}`}</ButtonLike>
        </div>
    );
};
