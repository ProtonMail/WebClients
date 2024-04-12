import { type FC } from 'react';

import clsx from '@proton/utils/clsx';

type Props = { title: string; description?: string; className?: string };

export const SubHeader: FC<Props> = ({ title, description, className }) => (
    <section className={clsx('flex flex-column flex-nowrap gap-3', className)}>
        <header className="border-bottom pb-2 text-bold text-4xl">{title}</header>
        {description && <span>{description}</span>}
    </section>
);
