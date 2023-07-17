import type { ReactNode, VFC } from 'react';

import { Scroll } from '@proton/atoms/Scroll';
import clsx from '@proton/utils/clsx';

import './Panel.scss';

type Props = {
    header?: ReactNode;
    children?: ReactNode;
    className?: string;
};

export const Panel: VFC<Props> = ({ header, children, className }) => {
    return (
        <article className={clsx('pass-panel flex flex-column flex-nowrap', className)}>
            {header && <div className="flex-item-noshrink px-4 py-3">{header}</div>}
            <div className="flex-item-fluid-auto h100 overflow-hidden relative">
                <Scroll className="absolute w-full h-full">
                    <div className="px-4 pt-1 pb-3">{children}</div>
                </Scroll>
            </div>
        </article>
    );
};
