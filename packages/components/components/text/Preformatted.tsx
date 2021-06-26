import React from 'react';
import { classnames } from '../../helpers';

const Preformatted = ({ className = '', ...rest }: React.HTMLAttributes<HTMLPreElement>) => {
    return <pre className={classnames(['bg-weak p1 mb1 scroll-if-needed', className])} {...rest} />;
};

export default Preformatted;
