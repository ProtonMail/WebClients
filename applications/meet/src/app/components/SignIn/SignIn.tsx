import { Button } from '@proton/atoms/Button/Button';
import { ButtonLikeShapeEnum, ButtonLikeSizeEnum } from '@proton/atoms/Button/ButtonLike';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

type Props = {
    children: React.ReactNode;
    className?: string;
    size?: ButtonLikeSizeEnum;
    shape?: ButtonLikeShapeEnum;
    style?: React.CSSProperties;
};

export const MeetSignIn = ({
    children,
    className,
    size = ButtonLikeSizeEnum.Medium,
    shape = ButtonLikeShapeEnum.Ghost,
    style,
}: Props) => {
    const handleSignIn = (returnUrl: string) =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
            extra: {
                returnUrl,
            },
        });

    const handleSignInClick = () => {
        const hash = window.location.hash;

        if (hash && !isUrlPasswordValid(hash)) {
            return window.location.pathname.replace('/guest', '');
        }

        handleSignIn(window.location.pathname.replace('/guest', '') + window.location.hash);
    };

    return (
        <Button onClick={handleSignInClick} className={className} size={size} shape={shape} style={style}>
            {children}
        </Button>
    );
};
