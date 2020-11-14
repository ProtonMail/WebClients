import React from 'react';
import Icon, { Props as IconProps } from './Icon';

interface Props extends IconProps {
    name: string;
    className?: string;
}

const MimeIcon = ({ name, className, ...rest }: Props) => {
    return <Icon name={`#mime-${name}`} className={className} size={24} viewBox="0 0 24 24" {...rest} />;
};

export default MimeIcon;
