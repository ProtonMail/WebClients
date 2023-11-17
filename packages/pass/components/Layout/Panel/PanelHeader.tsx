import type { ReactNode, VFC } from 'react';

import clsx from '@proton/utils/clsx';

type Props = {
    className?: string;
    title?: string;
    subtitle?: ReactNode;
    actions?: ReactNode[];
};

export const PanelHeader: VFC<Props> = ({ className, actions, ...props }) => {
    const title = 'title' in props ? props.title : undefined;
    const subtitle = 'subtitle' in props ? props.subtitle : undefined;
    const withActions = Array.isArray(actions) && actions.length > 0;
    const onlyActions = withActions && [title, subtitle].every((prop) => prop === undefined);

    return (
        <header
            className={clsx(
                'pass-panel-header flex flex-nowrap justify-space-between items-center gap-2',
                className
            )}
        >
            {title !== undefined && (
                <div>
                    <h2 className="text-2xl text-bold text-ellipsis lh-full mb-0-5">{title}</h2>
                    {subtitle}
                </div>
            )}
            {withActions && (
                <div
                    className={clsx(
                        'flex flex-nowrap justify-space-between items-center flex-item-noshrink gap-1',
                        onlyActions && 'w-full'
                    )}
                >
                    {actions}
                </div>
            )}
        </header>
    );
};
