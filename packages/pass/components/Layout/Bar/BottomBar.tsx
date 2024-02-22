import type { FC, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export type BottomBarProps = {
    className?: string;
    hidden?: boolean;
    text: ReactNode;
};

export const BottomBar: FC<BottomBarProps> = ({ className, hidden = false, text }) => {
    return (
        <div className={clsx('w-full anime-reveal', hidden && 'anime-reveal--hidden', className)}>
            <div className="flex flex-nowrap gap-2 items-center justify-center text-center text-sm p-2">{text}</div>
        </div>
    );
};
