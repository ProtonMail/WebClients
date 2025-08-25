import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

type MainProps = { fullWidth?: boolean };

export const Main: FC<PropsWithChildren<MainProps>> = ({ children, fullWidth }) => (
    <main
        className={clsx('flex flex-column justify-center items-center w-full', !fullWidth && 'max-w-custom')}
        style={{ '--max-w-custom': '29rem' }}
    >
        {children}
    </main>
);
