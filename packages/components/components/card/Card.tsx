import React from 'react';

import { classnames } from '../../helpers';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {}

const Card = ({ className, ...rest }: CardProps) => {
    return <div className={classnames(['rounded p1 bg-global-highlight', className])} {...rest} />;
};

export default Card;
