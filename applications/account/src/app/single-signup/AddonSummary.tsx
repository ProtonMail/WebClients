import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {
    label: string;
    numberOfItems: number;
    price: ReactNode;
    subline?: ReactNode;
}

const AddonSummary = ({ label, numberOfItems, price, subline, className, ...rest }: Props) => {
    return (
        <div className={clsx('flex', className)} {...rest}>
            <span className="flex-1">{label}</span>
            <div>
                <div>
                    {numberOfItems} x {price}
                </div>
                {subline !== undefined && <div className="color-weak text-right text-sm">{subline}</div>}
            </div>
        </div>
    );
};

export default AddonSummary;
