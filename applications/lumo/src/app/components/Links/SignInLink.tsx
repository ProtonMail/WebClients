import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/index';

export const SignInLink = ({ className }: { className?: string }) => {
    return (
        <ButtonLike as={SettingsLink} color="norm" shape="underline" path="" className={className}>{c(
            'collider_2025: Link'
        ).t`Sign in`}</ButtonLike>
    );
};

export const SignInLinkButton = ({
    className,
    color,
    shape,
}: {
    className?: string;
    color?: 'norm' | 'weak';
    shape?: 'solid' | 'outline';
}) => {
    return (
        <ButtonLike as={SettingsLink} className={className} color={color || 'norm'} shape={shape || 'solid'} path="">{c(
            'collider_2025: Link'
        ).t`Sign in`}</ButtonLike>
    );
};
