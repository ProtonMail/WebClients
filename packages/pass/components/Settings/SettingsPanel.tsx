import type { FC, PropsWithChildren } from 'react';

import { Card } from '@proton/atoms/Card';
import clsx from '@proton/utils/clsx';

type Props = {
    className?: string;
    contentClassname?: string;
    subTitle?: string;
    title: string;
};
export const SettingsPanel: FC<PropsWithChildren<Props>> = ({
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
        <strong className="color-norm block mb-1">{title}</strong>
        {subTitle && <em className="block text-sm color-weak mb-2">{subTitle}</em>}
        <hr className="mt-2 mb-0 border-weak shrink-0" />
        <div className={contentClassname}>{children}</div>
    </Card>
);
