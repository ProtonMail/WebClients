import { ComponentPropsWithRef, forwardRef } from 'react';

import { isFirefoxLessThan55 } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { IconSize } from './Icon';

export type MimeName =
    | 'attachments'
    | 'calendar'
    | 'doc'
    | 'folder'
    | 'font'
    | 'image'
    | 'keynote'
    | 'keytrust'
    | 'numbers'
    | 'pages'
    | 'pdf'
    | 'ppt'
    | 'sound'
    | 'text'
    | 'unknown'
    | 'video'
    | 'xls'
    | 'xml'
    | 'zip';

const viewboxMap = {
    sm: 16,
    md: 24,
    lg: 48,
};

const getIconAsset = (size: IconSize) => {
    if (size < 20) {
        return 'sm';
    }
    if (size < 40) {
        return 'md';
    }
    return 'lg';
};

export interface MimeIconProps extends ComponentPropsWithRef<'svg'> {
    name: MimeName;
    size?: IconSize;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
}

/**
 * Component to render SVG file icons.
 * Use it the same way as Icon, just without need to specify name space
 * (automatically mime is used), and proper asset is chosen based on the
 * passed size parameter: mime icons have three different shapes to fit
 * any space the best way.
 */
const MimeIcon = forwardRef<SVGSVGElement, MimeIconProps>(
    ({ name, size = 16, alt, title, className, ...rest }, ref) => {
        const iconAsset = getIconAsset(size);
        const viewBox = `0 0 ${viewboxMap[iconAsset]} ${viewboxMap[iconAsset]}`;

        // Patch broken SVG lookup for Firefox < 55.
        const href = isFirefoxLessThan55() ? window.location.href.replace(window.location.hash, '') : '';

        return (
            <>
                <svg
                    role="img"
                    viewBox={viewBox}
                    focusable="false"
                    className={clsx([`icon-${size}p`, className])}
                    ref={ref}
                    {...rest}
                >
                    {title && <title>{title}</title>}
                    <use xlinkHref={`${href}#mime-${iconAsset}-${name}`} />
                </svg>

                {alt ? <span className="sr-only">{alt}</span> : null}
            </>
        );
    }
);

export default MimeIcon;
