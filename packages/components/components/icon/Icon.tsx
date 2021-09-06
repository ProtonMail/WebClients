import { forwardRef } from 'react';

import { classnames } from '../../helpers';

export type IconSize = 6 | 8 | 10 | 11 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 28 | 40 | 42 | 48 | 56 | 60 | 100 | 110;

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
    /** Determines which icon to render based on its name */
    name: string;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /** The size of the icon */
    size?: IconSize;
    /** How many degrees the icon should be rotated */
    rotate?: number;
    /** Applied as inline css 'color' attribute on the svg element */
    color?: string;
    /** Icon name prefix */
    nameSpaceSvg?: string;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
    (
        {
            name,
            alt,
            title,
            color,
            className = '',
            viewBox = '0 0 16 16',
            size = 16,
            rotate = 0,
            nameSpaceSvg = 'ic',
            ...rest
        },
        ref
    ) => {
        const style = {
            ...(color && { color }),
            ...(rotate && { transform: `rotate(${rotate}deg)` }),
        };

        return (
            <>
                <svg
                    style={style}
                    viewBox={viewBox}
                    className={classnames([`icon-${size}p`, className])}
                    role="img"
                    focusable="false"
                    ref={ref}
                    {...rest}
                >
                    {title ? <title>{title}</title> : null}
                    <use xlinkHref={name.startsWith('#') ? name : `#${nameSpaceSvg}-${name}`} />
                </svg>
                {alt ? <span className="sr-only">{alt}</span> : null}
            </>
        );
    }
);

export default Icon;
