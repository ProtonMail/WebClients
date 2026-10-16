import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import type { ContentLayout } from './Layout';

type MainProps = { fullWidth?: boolean; contentLayout?: ContentLayout };

export const Main: FC<PropsWithChildren<MainProps>> = ({ children, fullWidth, contentLayout = 'centered' }) => {
    if (contentLayout === 'fill') {
        return <main className="flex flex-column flex-1 min-h-0 w-full">{children}</main>;
    }

    return (
        <main
            className={clsx('flex flex-column justify-center items-center w-full py-8', !fullWidth && 'max-w-custom')}
            style={{ '--max-w-custom': '29rem' }}
        >
            {children}
        </main>
    );
};
