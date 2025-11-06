import { c } from 'ttag';

import { IcTag } from '@proton/icons/icons/IcTag';
import clsx from '@proton/utils/clsx';

import './DiscountBanner.scss';

interface Props {
    discountPercent: number;
    selectedPlanTitle: string;
    className?: string;
}

const DiscountBanner = ({ discountPercent, selectedPlanTitle, className }: Props) => {
    const boldDiscountPercent = (
        <b key="bold-discount-percent">{
            // full sentence: Your 10% discount to Proton Pass has been applied
            c('Info').t`${discountPercent}% discount`
        }</b>
    );
    const boldPlanTitle = <b key="bold-plan-title">{selectedPlanTitle}</b>;

    return (
        <div
            className={clsx(
                'single-signup-discount-banner flex-nowrap text-lg rounded px-4 py-2 flex gap-2',
                className
            )}
        >
            <div className="shrink-0 flex items-center">
                <IcTag size={4} />
            </div>

            <span className="text-center">
                {
                    // full sentence: Your 10% discount to Proton Pass has been applied
                    c('Info').jt`Your ${boldDiscountPercent} to ${boldPlanTitle} has been applied`
                }
            </span>
        </div>
    );
};

export default DiscountBanner;
