import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { SubTheme } from '../../utils';

interface AvatarProps {
    children: ReactNode;
    subTheme: SubTheme;
}

export const Avatar = ({ children, subTheme }: AvatarProps) => {
    return (
        <div
            className={clsx(
                'rounded-full w-custom h-custom mr-4 flex items-center justify-center text-lg text-semibold shrink-0',
                subTheme
            )}
            style={{
                '--h-custom': '2.5rem',
                '--w-custom': '2.5rem',
                background: 'var(--interaction-norm-minor-1)',
                color: 'var(--interaction-norm)',
            }}
        >
            {children}
        </div>
    );
};
