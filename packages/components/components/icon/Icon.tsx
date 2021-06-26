import React, { forwardRef, memo } from 'react';
import { classnames } from '../../helpers';

export interface Props extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
    name: string;
    alt?: string;
    title?: string;
    viewBox?: string;
    className?: string;
    size?: number;
    color?: string;
    rotate?: number;
    nameSpaceSvg?: string;
}

/**
 * Component to print svg icon
 * <Icon name="label" alt="My label" />
 * @param name of the svg icon present in the design-system
 * @param className used on svg tag
 * @param size      To construct the icon size className icon-<size>p (default 16)
 * @param viewBox
 * @param color
 * @param alt       Used by screen reader
 * @param title     equivalent of title attribute
 * @param rotate    How many degrees the icon should be rotated
 */
const Icon = (
    { name, alt, title, color, className = '', viewBox = '0 0 16 16', size = 16, rotate = 0, nameSpaceSvg = 'shape', ...rest }: Props,
    ref: React.Ref<SVGSVGElement>
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
};

export default memo(forwardRef<SVGSVGElement, Props>(Icon));
