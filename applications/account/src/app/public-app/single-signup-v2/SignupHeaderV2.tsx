import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

const SignupHeaderV2 = ({ children, className }: { children?: ReactNode; className?: string }) => {
    return (
        <div className={clsx('single-signup-header-v2 text-center mt-6 md:mt-8 mb-4', className)}>
            <h1 className="m-0 large-font lg:px-4 text-semibold">{children}</h1>
        </div>
    );
};

export default SignupHeaderV2;
