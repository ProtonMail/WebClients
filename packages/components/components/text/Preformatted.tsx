import { HTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

const Preformatted = ({ className = '', ...rest }: HTMLAttributes<HTMLPreElement>) => {
    return <pre className={clsx(['bg-weak p-4 mb-4 scroll-if-needed', className])} {...rest} />;
};

export default Preformatted;
