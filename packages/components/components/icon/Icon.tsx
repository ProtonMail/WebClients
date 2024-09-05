import { forwardRef } from 'react';

import type { IconName, IconSize } from '@proton/icons';
import clsx from '@proton/utils/clsx';

export type { IconName, IconSize } from '@proton/icons';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
    /** Determines which icon to render based on its name */
    name: IconName;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /**
     * The size of the icon
     * Refer to the sizing taxonomy: https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing
     */
    size?: IconSize;
    /** How many degrees the icon should be rotated */
    rotate?: number;
    /** Applied as inline css 'color' attribute on the svg element */
    color?: string;
    /** Icon name prefix */
    nameSpaceSvg?: string;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ name, alt, title, color, className = '', viewBox = '0 0 16 16', size = 4, rotate = 0, ...rest }, ref) => {
        const style = {
            ...(color && { color }),
            ...(rotate && { transform: `rotate(${rotate}deg)` }),
        };

        return (
            <>
                <svg
                    style={style}
                    viewBox={viewBox}
                    className={clsx([`icon-size-${size}`, className])}
                    role="img"
                    focusable="false"
                    ref={ref}
                    aria-hidden="true"
                    {...rest}
                >
                    {title ? <title>{title}</title> : null}
                    <use xlinkHref={`#ic-${name}`} />
                </svg>
                {alt ? <span className="sr-only">{alt}</span> : null}
            </>
        );
    }
);

export default Icon;
