import React from 'react';
import Icon, { Props as IconProps } from './Icon';

const nameSpaceSvg = 'mime';

const viewboxMap = {
    sm: 16,
    md: 24,
    lg: 48,
};

const getIconSize = (size: number) => {
    if (size < 20) {
        return 'sm';
    }
    if (size < 40) {
        return 'md';
    }
    return 'lg';
};

/**
 * Component to render SVG file icons.
 * Use it the same way as Icon, just without need to specify name space
 * (automatically mime is used), and proper size is chosen based on the
 * passed size parameter: mime icons have three different shapes to fit
 * any space the best way.
 */
const MimeIcon = ({ name, size = 16, ...rest }: IconProps) => {
    const iconSize = getIconSize(size);
    const fullName = `${iconSize}-${name}`;
    const viewBox = `0 0 ${viewboxMap[iconSize]} ${viewboxMap[iconSize]}`;

    return <Icon name={fullName} size={size} viewBox={viewBox} nameSpaceSvg={nameSpaceSvg} {...rest} />;
};

export default MimeIcon;
