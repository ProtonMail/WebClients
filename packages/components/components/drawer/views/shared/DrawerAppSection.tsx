import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './DrawerAppSection.scss';

interface Props {
    children: ReactNode;
    className?: string;
}

const DrawerAppSection = ({ children, className }: Props) => {
    return (
        <div
            className={clsx(
                'drawerAppSection w-full flex *:min-size-auto flex-column gap-2 shrink-0 justify-center px-4 py-2 rounded-lg shadow-norm',
                className
            )}
        >
            {children}
        </div>
    );
};

export default DrawerAppSection;
