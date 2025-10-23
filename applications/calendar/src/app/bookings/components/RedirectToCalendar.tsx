import { c } from 'ttag';

import { ButtonLike, type ButtonLikeOwnProps } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

interface Props extends ButtonLikeOwnProps {
    className?: string;
}

/**
 * This is used to keep track of the signup coming from the booking app
 */
export const RedirectToCalendarButton = ({ className, ...rest }: Props) => {
    return (
        <ButtonLike as={Href} href="/signup" target="_self" className={className} {...rest}>
            {c('Action').t`Join ${CALENDAR_APP_NAME}`}
        </ButtonLike>
    );
};
