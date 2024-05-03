import type { FC, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

type Props = {
    actions?: ReactNode;
    className?: string;
    description?: ReactNode;
    title: string;
};

export const SubHeader: FC<Props> = ({ actions, className, description, title }) => (
    <header className={clsx('flex flex-nowrap justify-space-between', className)}>
        <div className="flex flex-1 flex-column flex-nowrap gap-3">
            <h2 className="text-bold text-3xl">{title}</h2>
            {description && <span>{description}</span>}
        </div>
        <div>{actions}</div>
    </header>
);
