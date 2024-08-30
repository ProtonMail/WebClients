import type { ReactNode } from 'react';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface SecurityCheckupCardInnerProps {
    title: string;
    subTitle?: string;
    prefix?: ReactNode;
    suffix?: ReactNode;
    className?: string;
    checkmark?: boolean;
}

const SecurityCheckupCardInner = ({
    title,
    subTitle,
    prefix,
    suffix,
    className,
    checkmark,
}: SecurityCheckupCardInnerProps) => {
    return (
        <div className={clsx('flex items-center gap-4 p-4', className)}>
            {prefix}

            <div className="flex-1 flex flex-column">
                <h2 className="text-rg text-semibold text-wrap-balance">
                    {title}
                    {checkmark && (
                        <>
                            &nbsp;
                            <Icon className="shrink-0 color-success mb-0.5" size={4} name="checkmark-circle" />
                        </>
                    )}
                </h2>
                {subTitle && <div className="text-sm color-weak">{subTitle}</div>}
            </div>

            {suffix}
        </div>
    );
};

export default SecurityCheckupCardInner;
