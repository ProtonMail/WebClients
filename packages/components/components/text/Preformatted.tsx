import { HTMLAttributes } from 'react';

import { classnames } from '../../helpers';

const Preformatted = ({ className = '', ...rest }: HTMLAttributes<HTMLPreElement>) => {
    return <pre className={classnames(['bg-weak p1 mb-4 scroll-if-needed', className])} {...rest} />;
};

export default Preformatted;
