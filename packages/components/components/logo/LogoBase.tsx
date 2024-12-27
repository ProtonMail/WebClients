import { type ComponentPropsWithoutRef } from 'react';

import type { IconSize } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { getLogoWidthStyles } from './helpers';

export type LogoVariant = 'with-wordmark' | 'glyph-only' | 'wordmark-only';

export interface LogoProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
    size?: IconSize;
    variant?: LogoVariant;
    hasTitle?: boolean;
}

type Props = ComponentPropsWithoutRef<'svg'> & {
    logoWidth: number;
    logoHeight: number;
    title?: string;
    uid: string;
    variant: LogoVariant;
    size?: IconSize;
};

const LogoBase = ({ title, logoWidth, logoHeight, className, variant, size, uid, children, ...rest }: Props) => {
    const hasIconSize = size && variant === 'glyph-only';
    // this ensure logo scales properly with text zoom
    const logoWidthStyles = !hasIconSize && variant === 'with-wordmark' ? getLogoWidthStyles(logoWidth) : undefined;

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <svg
            // eslint-disable-next-line custom-rules/deprecate-sizing-classes
            xmlns="http://www.w3.org/2000/svg"
            // eslint-disable-next-line custom-rules/deprecate-sizing-classes
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${logoWidth} ${logoHeight}`}
            width={logoWidth}
            height={logoHeight}
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
