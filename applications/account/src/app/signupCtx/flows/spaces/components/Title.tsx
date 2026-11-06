import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

const Title = ({ children, spaced = true }: { children: ReactNode; spaced?: boolean }) => (
    <h1 className={clsx('spaces-title font-arizona text-center py-1', spaced ? 'mb-8' : 'mb-4')}>{children}</h1>
);

export default Title;
