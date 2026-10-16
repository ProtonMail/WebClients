import type { ElementType, ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import './OnboardingButton.scss';

type OnboardingButtonVariant = 'norm' | 'outline';

const VARIANT_CLASS: Record<OnboardingButtonVariant, string> = {
    norm: 'pass-onboarding-button-norm',
    outline: 'pass-onboarding-button-outline-norm',
};

type OwnProps = Omit<ButtonLikeProps<'button'>, 'as' | 'ref'> & {
    variant?: OnboardingButtonVariant;
};

type OnboardingButtonProps<E extends ElementType> = PolymorphicPropsWithRef<OwnProps, E>;

const defaultElement = 'button';

const OnboardingButtonBase = <E extends ElementType = typeof defaultElement>(
    { variant = 'norm', className, as, ...rest }: OnboardingButtonProps<E>,
    ref: ForwardedRef<Element>
) => {
    const element: ElementType = as || defaultElement;

    return (
        <ButtonLike
            as={element}
            ref={ref}
            pill
            {...(element === defaultElement && { type: 'button' })}
            {...rest}
            className={clsx(VARIANT_CLASS[variant], className)}
        />
    );
};

export const OnboardingButton: PolymorphicForwardRefExoticComponent<OwnProps, typeof defaultElement> =
    forwardRef(OnboardingButtonBase);
