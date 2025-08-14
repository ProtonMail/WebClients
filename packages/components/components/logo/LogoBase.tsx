import { type ComponentPropsWithoutRef } from 'react';

import type { IconSize } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { getLogoWidthStyles } from './helpers';

export type LogoVariant = 'with-wordmark' | 'glyph-only' | 'wordmark-only';

export interface LogoProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
    size?: IconSize;
    variant?: LogoVariant;
    hasTitle?: boolean;
    scale?: number;
}

type Props = ComponentPropsWithoutRef<'svg'> & {
    logoWidth: number;
    logoHeight: number;
    title?: string;
    uid: string;
    variant: LogoVariant;
    size?: IconSize;
    scale?: number;
};

const LogoBase = ({
    title,
    logoWidth,
    logoHeight,
    className,
    variant,
    size,
    uid,
    children,
    scale = 1,
    ...rest
}: Props) => {
    const logoWidthScaled = Math.ceil(logoWidth * scale);
    const logoHeightScaled = Math.ceil(logoHeight * scale);

    const hasIconSize = size && variant === 'glyph-only';
    // this ensure logo scales properly with text zoom
    const logoWidthStyles =
        !hasIconSize && variant === 'with-wordmark' ? getLogoWidthStyles(logoWidthScaled) : undefined;

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <svg
            // eslint-disable-next-line custom-rules/deprecate-sizing-classes
            xmlns="http://www.w3.org/2000/svg"
            // eslint-disable-next-line custom-rules/deprecate-sizing-classes
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${logoWidth} ${logoHeight}`}
            width={logoWidthScaled}
            height={logoHeightScaled}
            fill="none"
            role="img"
            className={clsx('logo', hasIconSize && `icon-size-${size}`, variant, className)}
            aria-labelledby={`${uid}-title`}
            {...rest}
            style={logoWidthStyles || rest?.style ? { ...logoWidthStyles, ...rest?.style } : undefined}
        >
            {title && <title id={`${uid}-title`}>{title}</title>}
            {children}
        </svg>
    );
};

export default LogoBase;
