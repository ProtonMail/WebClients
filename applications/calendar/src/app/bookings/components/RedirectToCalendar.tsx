import type { PropsWithChildren } from 'react';

import { ButtonLike, type ButtonLikeOwnProps } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';

interface Props extends PropsWithChildren<ButtonLikeOwnProps> {
    className?: string;
}

/**
 * This is used to keep track of the signup coming from the booking app
 */
export const RedirectToCalendar = ({ children, className, ...rest }: Props) => {
    return (
        <ButtonLike as={Href} href="/signup" target="_self" className={className} {...rest}>
            {children}
        </ButtonLike>
    );
};
