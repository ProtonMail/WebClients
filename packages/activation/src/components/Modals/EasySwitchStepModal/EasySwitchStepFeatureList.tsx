import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface EasySwitchStepFeature {
    icon: ReactNode;
    title: string;
    description: ReactNode;
}

/** Icon + title + description rows used in the Easy Switch step modals. */
export const EasySwitchStepFeatureList = ({
    items,
    className,
}: {
    items: EasySwitchStepFeature[];
    className?: string;
}) => (
    <ul className={clsx('unstyled m-0 flex flex-column gap-6', className)}>
        {items.map(({ icon, title, description }) => (
            <li key={title} className="flex flex-nowrap items-start gap-3">
                <span className="shrink-0 flex mt-0.5">{icon}</span>
                <span className="flex flex-column flex-1">
                    <span>{title}</span>
                    <span className="color-weak">{description}</span>
                </span>
            </li>
        ))}
    </ul>
);
