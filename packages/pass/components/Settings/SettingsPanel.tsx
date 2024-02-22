import type { FC, PropsWithChildren, ReactNode } from 'react';

import { Card } from '@proton/atoms/Card';
import clsx from '@proton/utils/clsx';

type Props = {
    actions?: ReactNode[];
    className?: string;
    contentClassname?: string;
    subTitle?: string;
    title: string;
};
export const SettingsPanel: FC<PropsWithChildren<Props>> = ({
    actions,
    children,
    className,
    contentClassname = 'py-4',
    subTitle,
    title,
}) => (
    <Card
        rounded
        className={clsx(
            'pass-settings--panel flex flex-nowrap flex-column p-3 mb-4 relative max-w-custom *:min-size-auto',
            className
        )}
        style={{ '--max-w-custom': '50em' }}
        background={false}
    >
        <div className="flex flex-nowrap gap-2 items-center">
            <strong className="color-norm block mb-1 flex-1 text-ellipsis">{title}</strong>
            <div className="shrink-0">{actions}</div>
        </div>
        {subTitle && <em className="block text-sm color-weak mb-2">{subTitle}</em>}
        <hr className="mt-2 mb-0 border-weak shrink-0" />
        <div className={contentClassname}>{children}</div>
    </Card>
);
