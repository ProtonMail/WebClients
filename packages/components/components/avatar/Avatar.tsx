import React from 'react';

import { classnames } from '../../helpers';

interface AvatarProps extends React.ComponentPropsWithoutRef<'span'> {}

const Avatar = ({ className: classNameProp, children, ...rest }: AvatarProps) => {
    const className = classnames([
        classNameProp,
        'avatar rounded inline-flex flex-justify-center flex-align-items-center',
    ]);

    return (
        <span className={className} {...rest}>
            {children}
        </span>
    );
};

export default Avatar;
