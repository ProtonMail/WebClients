import type { ReactNode } from 'react';

import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import clsx from '@proton/utils/clsx';

export interface SecurityCheckupCardInnerProps {
    title: ReactNode;
    subTitle?: ReactNode;
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
                            <IcCheckmarkCircle className="shrink-0 color-success mb-0.5" size={4} />
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
