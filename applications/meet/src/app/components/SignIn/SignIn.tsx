import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLikeShapeEnum, ButtonLikeSizeEnum } from '@proton/atoms/Button/ButtonLike';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { requestFork } from '@proton/shared/lib/authentication/fork/consume';
import { APPS } from '@proton/shared/lib/constants';

type Props = Omit<ButtonProps, 'children' | 'onClick'> & {
    children: ReactNode;
    onClick?: () => void;
};

export const MeetSignIn = forwardRef<HTMLButtonElement, Props>(
    ({ children, size = ButtonLikeSizeEnum.Medium, shape = ButtonLikeShapeEnum.Ghost, onClick, ...rest }, ref) => {
        const handleSignIn = (returnUrl: string) =>
            requestFork({
                fromApp: APPS.PROTONMEET,
                forkType: ForkType.LOGIN,
                extra: {
                    returnUrl,
                },
            });

        const handleSignInClick = () => {
            onClick?.();
            const hash = window.location.hash;

            if (hash && !isUrlPasswordValid(hash)) {
                return window.location.pathname.replace('/guest', '');
            }

            handleSignIn(window.location.pathname.replace('/guest', '') + window.location.hash);
        };

        return (
            <Button ref={ref} {...rest} onClick={handleSignInClick} size={size} shape={shape}>
                {children}
            </Button>
        );
    }
);

MeetSignIn.displayName = 'MeetSignIn';
