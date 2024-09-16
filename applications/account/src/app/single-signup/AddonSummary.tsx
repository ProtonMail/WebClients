import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Price } from '@proton/components';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {
    label: string;
    numberOfItems: number;
    currency: Currency;
    price: number;
    subline?: ReactNode;
}

const AddonSummary = ({ label, numberOfItems, currency, price, subline, className, ...rest }: Props) => {
    return (
        <div className={clsx('flex', className)} {...rest}>
            <span className="flex-1">{label}</span>
            <div>
                <div>
                    {numberOfItems} x <Price currency={currency}>{price}</Price>
                </div>
                {subline !== undefined && <div className="color-weak text-right text-sm">{subline}</div>}
            </div>
        </div>
    );
};

export default AddonSummary;
