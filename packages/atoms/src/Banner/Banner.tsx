import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import React from 'react';

import { c } from 'ttag';

import type { ThemeColorUnion } from '@proton/colors/types';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

import { Button } from '../Button/Button';
import type { ButtonLikeOwnProps, ButtonLikeShape } from '../Button/ButtonLike';
import type { HrefProps } from '../Href/Href';

import './Banner.scss';

interface BaseButtonLikeProps {
    shape: ButtonLikeShape;
    color: ThemeColorUnion;
}

type RestrictedButtonLikeProps = {
    size: 'small';
} & BaseButtonLikeProps &
    Omit<ButtonLikeOwnProps, 'shape' | 'size' | 'color'>;

export enum BannerVariants {
    NORM = 'norm',
    NORM_OUTLINE = 'norm-outline',
    INFO = 'info',
    INFO_OUTLINE = 'info-outline',
    SUCCESS = 'success',
    SUCCESS_OUTLINE = 'success-outline',
    WARNING = 'warning',
    WARNING_OUTLINE = 'warning-outline',
    DANGER = 'danger',
    DANGER_OUTLINE = 'danger-outline',
}

const BannerVariantsBordered = [
    BannerVariants.NORM_OUTLINE,
    BannerVariants.INFO_OUTLINE,
    BannerVariants.SUCCESS_OUTLINE,
    BannerVariants.WARNING_OUTLINE,
    BannerVariants.DANGER_OUTLINE,
];

export interface BannerProps extends ComponentPropsWithoutRef<'div'> {
    variant?: BannerVariants | `${BannerVariants}`;
    icon?: ReactElement;
    noIcon?: boolean;
    action?: ReactElement<RestrictedButtonLikeProps>;
    link?: ReactElement<HrefProps>;
    onDismiss?: () => void;
    largeRadius?: boolean;
    dismissibleIconBigger?: boolean;
    /** temporary prop to make the banner opaque variant, we'll generalize this later */
    opaqueVariant?: boolean;
    contentWrapperClassName?: string;
    borderless?: boolean;
}

const getDefaultIcon = (variant: BannerVariants) => {
    if (
        [
            BannerVariants.NORM,
            BannerVariants.NORM_OUTLINE,
            BannerVariants.INFO,
            BannerVariants.INFO_OUTLINE,
            BannerVariants.SUCCESS,
            BannerVariants.SUCCESS_OUTLINE,
        ].includes(variant)
    ) {
        return <IcInfoCircle />;
    }
    return <IcExclamationTriangleFilled />;
};

const BannerIcon = ({ icon }: { icon: ReactElement }) => {
    return <div className="banner-icon flex shrink-0 mt-0.5 mb-auto">{icon}</div>;
};

const getButtonProps = (variant: BannerVariants): BaseButtonLikeProps => {
    switch (variant) {
        case BannerVariants.INFO:
            return { shape: 'outline', color: 'info' };
        case BannerVariants.INFO_OUTLINE:
            return { shape: 'solid', color: 'info' };
        case BannerVariants.SUCCESS:
            return { shape: 'outline', color: 'success' };
        case BannerVariants.SUCCESS_OUTLINE:
            return { shape: 'solid', color: 'success' };
        case BannerVariants.DANGER:
            return { shape: 'outline', color: 'danger' };
        case BannerVariants.DANGER_OUTLINE:
            return { shape: 'solid', color: 'danger' };
        case BannerVariants.WARNING:
            return { shape: 'outline', color: 'warning' };
        case BannerVariants.WARNING_OUTLINE:
            return { shape: 'solid', color: 'warning' };
        default:
            return { shape: 'outline', color: 'weak' };
    }
};

export const Banner = ({
    variant = BannerVariants.NORM,
    icon = getDefaultIcon(variant as BannerVariants),
    noIcon = false,
    onDismiss,
    children,
    action,
    link,
    className,
    contentWrapperClassName,
    largeRadius = false,
    dismissibleIconBigger = false,
    opaqueVariant = false,
    borderless = false,
    ...rest
}: BannerProps) => {
    const handleDismiss = () => {
        onDismiss?.();
    };

    const DismissButton = () => (
        <Button
            size="small"
            shape="ghost"
            icon
            className="banner-dismiss shrink-0 grow-0 mb-auto"
            onClick={handleDismiss}
            title={c('Action').t`Dismiss`}
        >
            {dismissibleIconBigger ? (
                <IcCrossBig alt={c('Action').t`Dismiss`} />
            ) : (
                <IcCross alt={c('Action').t`Dismiss`} />
            )}
        </Button>
    );

    return (
        <div
            className={clsx(
                `banner banner--${variant} w-full`,
                BannerVariantsBordered.includes(variant as BannerVariants) ? 'border border-weak' : 'banner--no-border',
                largeRadius ? 'rounded-lg' : 'rounded',
                opaqueVariant ? 'banner--opaque-variant' : '',
                borderless ? 'banner--transparent-border' : '',
                className
            )}
            {...rest}
        >
            <div className="banner-inner p-1">
                <div className="banner-main flex flex-nowrap gap-2 pl-1 py-1">
                    {!noIcon && icon && <BannerIcon icon={icon} />}
                    <span className={contentWrapperClassName}>
                        {children}
                        {link && <> {link}</>}
                    </span>
                </div>
                <div className="banner-action flex shrink-0 grow-0 mb-auto">
                    {action &&
                        React.isValidElement(action) &&
                        React.cloneElement(action, {
                            shape: getButtonProps(variant as BannerVariants).shape,
                            color: getButtonProps(variant as BannerVariants).color,
                            size: 'small',
                        })}
                </div>
                {onDismiss ? <DismissButton /> : <div className="banner-dismiss" />}
            </div>
        </div>
    );
};
