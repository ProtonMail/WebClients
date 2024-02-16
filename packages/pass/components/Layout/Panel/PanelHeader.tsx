import type { FC, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

type Props = {
    className?: string;
    title?: string;
    subtitle?: ReactNode;
    actions?: ReactNode[];
    leftActions?: ReactNode[];
};

export const PanelHeader: FC<Props> = ({ className, actions, leftActions, ...props }) => {
    const title = 'title' in props ? props.title : undefined;
    const subtitle = 'subtitle' in props ? props.subtitle : undefined;
    const withActions = Array.isArray(actions) && actions.length > 0;
    const withLeftActions = Array.isArray(leftActions) && leftActions.length > 0;
    const onlyActions = withActions && [title, subtitle].every((prop) => prop === undefined);

    return (
        <header
            className={clsx('pass-panel-header flex flex-nowrap justify-space-between items-center gap-4', className)}
        >
            <div className="flex flex-nowrap items-center gap-4">
                {withLeftActions && (
                    <div className={clsx('flex flex-nowrap justify-space-between items-center shrink-0 gap-1')}>
                        {leftActions}
                    </div>
                )}
                {title !== undefined && (
                    <div>
                        <h2 className="text-2xl text-bold text-ellipsis lh-full mb-0-5">{title}</h2>
                        {subtitle}
                    </div>
                )}
            </div>
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
