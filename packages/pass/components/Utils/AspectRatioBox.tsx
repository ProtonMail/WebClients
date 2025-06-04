import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import './AspectRatioBox.scss';

type Props = {
    className?: string;
    width: number;
    height: number;
};

export const AspectRatioBox: FC<PropsWithChildren<Props>> = ({ width, height, className = '', children }) => (
    <div
        className={clsx('pass-aspect-ratio-box', className)}
        style={{ '--aspect-ratio': `${((height / width) * 100).toFixed(2)}%` }}
    >
        <div className="pass-aspect-ratio-box--content">{children}</div>
    </div>
);
