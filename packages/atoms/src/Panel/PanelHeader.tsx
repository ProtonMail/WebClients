import type { FC, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

type Props = {
    className?: string;
    title?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode[];
};

export const PanelHeader: FC<Props> = ({ className, actions, ...props }) => {
    const title = 'title' in props ? props.title : undefined;
    const subtitle = 'subtitle' in props ? props.subtitle : undefined;
    const withActions = Array.isArray(actions) && actions.length > 0;
    const onlyActions = withActions && [title, subtitle].every((prop) => prop === undefined);

    return (
        <header className={clsx('flex flex-nowrap justify-space-between items-center gap-4', className)}>
            {title !== undefined && (
                <div>
                    {title}
                    {subtitle}
                </div>
            )}
            {withActions && (
                <div
                    className={clsx(
                        'flex flex-nowrap justify-space-between items-center shrink-0 gap-1',
                        onlyActions && 'w-full'
                    )}
                >
                    {actions}
                </div>
            )}
        </header>
    );
};
